// Copy whole tables from one DuckDB file into another (used to build "delta"
// files that ship new cohort tables to a tier's database — only the listed
// tables move, so nothing else on the tier file is disturbed). Each table is
// dropped and recreated in the target; the source is attached read-only and
// never modified.
//
// MUST be run with duckdb 0.9.x (the version the backend reads) so the target
// file's on-disk format stays compatible — a newer duckdb would upgrade the
// file and the 0.9.1 backend could no longer open it. Run under node 18:
//   node database/copy_tables.mjs <target_db> <source_db> <table> [table...]
// No process may hold the TARGET open (read-write needs exclusive access);
// readers on the source are fine.
import { createRequire } from "node:module";
const require = createRequire(new URL("../server/package.json", import.meta.url));
const duckdb = require("duckdb");

const [targetDb, sourceDb, ...tables] = process.argv.slice(2);
if (!targetDb || !sourceDb || !tables.length) {
  console.error("usage: node copy_tables.mjs <target_db> <source_db> <table> [table...]");
  process.exit(1);
}
for (const t of tables) {
  if (!/^[a-z_][a-z0-9_]*$/.test(t)) {
    console.error("table name must be lower_snake_case:", t);
    process.exit(1);
  }
}

const db = new duckdb.Database(targetDb); // read-write; creates if missing
const run = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => (e ? rej(e) : res(r))));
const q = (id) => `"${id.replace(/"/g, '""')}"`;

// very wide tables (1,000+ gene columns) exceed the memory cap while copying —
// give DuckDB a disk spill dir next to the target and keep threads low
await run(`SET memory_limit='${process.env.DUCKDB_MEMORY_LIMIT || "8GB"}'`);
await run(`SET temp_directory='${(process.env.DUCKDB_TEMP_DIR || targetDb + ".tmp").replace(/'/g, "''")}'`);
await run("SET threads TO 2");
await run("SET preserve_insertion_order=false");
await run(`ATTACH '${sourceDb.replace(/'/g, "''")}' AS src (READ_ONLY)`);
for (const t of tables) {
  await run(`DROP TABLE IF EXISTS ${q(t)}`);
  await run(`CREATE TABLE ${q(t)} AS SELECT * FROM src.${q(t)}`);
  await run("CHECKPOINT");
  const [{ c }] = await run(`SELECT count(*) AS c FROM ${q(t)}`);
  console.log(`copied ${t}: ${Number(c)} rows`);
}
db.close(() => {});
