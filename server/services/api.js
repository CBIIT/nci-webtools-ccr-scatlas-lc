import express from "express";
import Router from "express-promise-router";
import duckdb from "duckdb";
import { promisify } from "util";
import { getQuery, getSchema } from "./query.js";
import { logErrors, logRequests } from "./middleware.js";
const { Database, OPEN_READONLY } = duckdb;

export async function createApi(env = process.env) {
  const database = new Database(env.DATABASE_PATH, OPEN_READONLY);
  const runQuery = promisify(database.all.bind(database));
  const schema = await getSchema(database);

  const router = Router();
  router.use(logRequests());
  router.use(express.json());

  router.get("/ping", async (request, response) => {
    const [results] = await runQuery("select 1 as status");
    response.json(results?.status === 1);
  });

  router.get("/query", async (request, response) => {
    const { logger } = request.app.locals;
    const { table, columns } = request.query;
    const query = getQuery(schema, table, columns.split(","));
    logger.info(query);
    const results = await runQuery(query);
    response.json(results);
  });

  router.use(logErrors());
  return router;
}
