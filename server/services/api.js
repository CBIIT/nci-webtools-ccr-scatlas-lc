const express = require("express");
const compression = require("compression");
const sqlite = require("better-sqlite3");

const { logRequests, publicCacheControl, withAsync } = require("./middleware");
const { query } = require("./query");

const database = new sqlite(process.env.DATABASE_PATH);

const lookup = {
  gene: database.prepare("select gene from gene order by gene").pluck().all(),
};

const router = express.Router();
router.use(express.json());
router.use(compression());
router.use(logRequests());
router.use(publicCacheControl(60 * 60));

router.get("/ping", (request, response) => {
  response.json(1 === database.prepare(`select 1`).pluck().get());
});

router.get("/lookup", (request, response) => {
  response.json(lookup);
});

router.get("/query", (request, response) => {
  response.json(query(database, request.query));
});

module.exports = router;
