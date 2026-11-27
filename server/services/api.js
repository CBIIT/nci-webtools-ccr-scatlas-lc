import express from "express";
import Router from "express-promise-router";
import duckdb from "duckdb";
import { promisify } from "util";
import { getQuery, getSchema, validate, quote } from "./query.js";
import { logErrors, logRequests } from "./middleware.js";
const { Database, OPEN_READONLY } = duckdb;

export async function createApi(env = process.env) {
  // The duckdb binding executes ALL of a Database instance's queries on one
  // background thread — extra connections share that thread, so with a single
  // instance one multi-million-row cohort scan stalls every other request
  // behind it (a 1.6s query was measured at 50s while a European-cohort scan
  // ran). A small pool of read-only Database instances gives each its own
  // worker thread, letting unrelated requests proceed in parallel. Each
  // instance defaults its memory_limit to a large share of system RAM, so cap
  // them explicitly — the pool must not multiply that default. Opening the
  // database also costs ~750MB PER INSTANCE outside that cap (the catalog for
  // the thousands-of-columns gene tables), so the pool must stay small: three
  // instances OOM-killed the 4GB web task under concurrent load.
  const poolSize = Number(env.DATABASE_POOL_SIZE) || 2;
  const memoryLimit = env.DATABASE_MEMORY_LIMIT || "256MB";
  const pool = Array.from({ length: poolSize }, () => {
    const database = new Database(env.DATABASE_PATH, OPEN_READONLY);
    return { run: promisify(database.all.bind(database)), inflight: 0, database };
  });
  await Promise.all(pool.map((slot) => slot.run(`SET memory_limit='${memoryLimit}'`)));

  const runQuery = async (sql, ...params) => {
    const slot = pool.reduce((a, b) => (a.inflight <= b.inflight ? a : b));
    slot.inflight++;
    try {
      return await slot.run(sql, ...params);
    } finally {
      slot.inflight--;
    }
  };
  const schema = await getSchema(pool[0].database);

  const router = Router();
  router.use(logRequests());
  router.use(express.json());

  // The load balancer's health check. It must NOT touch the database: when
  // every pool slot is busy with heavy queries the probe would queue, time
  // out, and the ALB would drain the (perfectly healthy) target — brief 502s
  // under load. The process being up to answer is the signal the ALB needs;
  // database trouble still surfaces through /query.
  router.get("/ping", (request, response) => {
    response.json(true);
  });

  // Unfiltered queries return every row of a table. Past a few hundred
  // thousand rows the binding's result conversion runs on the main thread —
  // the whole process stops serving anything for the duration — and past that
  // the JSON response outgrows V8's maximum string length anyway. No page
  // needs such a result (the multi-million-cell cohorts fetch per sample), so
  // refuse them instead of freezing.
  const rowLimit = Number(env.QUERY_ROW_LIMIT) || 1000000;

  router.get("/query", async (request, response) => {
    const { logger } = request.app.locals;
    const { table, columns, sample } = request.query;
    const { sql, params } = getQuery(schema, table, columns.split(","), sample);
    if (!params.length) {
      const countSql = `select count(*) as n from ${quote(validate(schema, table, columns.split(",")).table)}`;
      const [{ n }] = await runQuery(countSql);
      if (Number(n) > rowLimit) {
        response.status(400).json({ error: `Result too large: ${n} rows (limit ${rowLimit}). Filter by sample.` });
        return;
      }
    }
    logger.info(sql);
    const results = await runQuery(sql, ...params);
    response.json(results);
  });

  router.use(logErrors());
  return router;
}
