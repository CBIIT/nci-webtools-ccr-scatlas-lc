import express from "express";
import compression from "compression";
import sqlite from "better-sqlite3";
import duckdb from "duckdb";
import util from "util";
import getLogger from "./logger.js";
const logger = getLogger("scatlas-lc");

import { logRequests, publicCacheControl, withAsync } from "./middleware.js";
import { query } from "./query.js";


async function getSchema(db) {
  const run = util.promisify(db.all.bind(db));
  const schema = {};
  const tables = await run('show tables');
  for (const { name } of tables) {
    schema[name] = await run(`describe "${name}"`);
  }

  logger.info("Finished parsing schema")
  return schema;
}

export async function createApi() {
  const database = new duckdb.Database(process.env.DATABASE_PATH, duckdb.OPEN_READONLY)

  const schema = await getSchema(database)

  const router = express.Router();
  router.use(express.json());
  router.use(compression());
  router.use(logRequests());
  router.use(publicCacheControl(60 * 60));

  router.get("/ping", async (request, response) => {
    const run = util.promisify(database.all.bind(database));
    response.json((await run(`select 1`)).length === 1);
  });

  router.get("/query", async (request, response) => {
    const { table, columns } = request.query
    logger.info("Request Received")
    const results = await query(database, schema, table, columns.split(","));
    response.json(results)
  });
  
  return router
}
