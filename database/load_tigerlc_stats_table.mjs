// Load the CLIENT-provided per-cell-type stats CSV (stats_table_tigerlc.csv from the
// July 2026 drop) into a `tigerlc_stats_table` table in an existing DuckDB file. This
// is the display source for the statistics table under the TIGER-LC plots — kept
// verbatim (Feature + MeanExpression_<type> + PercentageExpression_<type>), separate
// from our computed `tigerlc_stats` (gene/count/percent/mean...) which feeds the gene
// list. Narrow (~6k rows), so plain read_csv_auto — no chunking.
//
// Run under node 18 with duckdb 0.9.x, backend stopped (read-write needs exclusive
// access):
//   node ../database/load_tigerlc_stats_table.mjs <db_path> <stats_table_csv>
import { createRequire } from "node:module";
const require = createRequire(new URL("../server/package.json", import.meta.url));
const duckdb = require("duckdb");

const dbPath = process.argv[2];
const csv = process.argv[3];
if (!dbPath || !csv) {
  console.error("usage: node load_tigerlc_stats_table.mjs <db_path> <stats_table_csv>");
  process.exit(1);
}

const db = new duckdb.Database(dbPath); // read-write
const run = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => (e ? rej(e) : res(r))));
const path = csv.replace(/'/g, "''");

await run("DROP TABLE IF EXISTS tigerlc_stats_table");
await run(`CREATE TABLE tigerlc_stats_table AS SELECT * FROM read_csv_auto('${path}', sample_size=-1)`);
const [{ c }] = await run("SELECT count(*) AS c FROM tigerlc_stats_table");
const cols = await run("SELECT column_name FROM information_schema.columns WHERE table_name='tigerlc_stats_table' ORDER BY ordinal_position");
console.log("tigerlc_stats_table rows:", Number(c));
console.log("columns:", cols.map((r) => r.column_name).join(", "));
db.close(() => {});
