// Load the TIGER-LC per-gene stats CSV (from stats_tigerlc.R) into a `tigerlc_stats`
// table in an existing DuckDB file. The table is narrow (~6k rows), so a plain
// read_csv_auto is fine — no chunking needed (unlike the wide cells loader).
//
// Run under node 18 with duckdb 0.9.x (keeps the on-disk format compatible with the
// backend), backend stopped (read-write needs exclusive access):
//   node ../database/load_tigerlc_stats.mjs <db_path> <stats_csv>
import { createRequire } from "node:module";
const require = createRequire(new URL("../server/package.json", import.meta.url));
const duckdb = require("duckdb");

const dbPath = process.argv[2];
const csv = process.argv[3];
if (!dbPath || !csv) {
  console.error("usage: node load_tigerlc_stats.mjs <db_path> <stats_csv>");
  process.exit(1);
}

const db = new duckdb.Database(dbPath); // read-write
const run = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => (e ? rej(e) : res(r))));
const path = csv.replace(/'/g, "''");

await run("DROP TABLE IF EXISTS tigerlc_stats");
// sample_size=-1 -> scan all rows for type detection (table is small)
await run(`CREATE TABLE tigerlc_stats AS SELECT * FROM read_csv_auto('${path}', sample_size=-1)`);
const [{ c }] = await run("SELECT count(*) AS c FROM tigerlc_stats");
const [{ n }] = await run("SELECT count(*) AS n FROM information_schema.columns WHERE table_name='tigerlc_stats'");
console.log("tigerlc_stats rows:", Number(c), "| columns:", Number(n));
db.close(() => {});
