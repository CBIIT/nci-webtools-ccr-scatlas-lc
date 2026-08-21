// Load a CLIENT-provided per-cell-type stats CSV into a named table in an
// existing DuckDB file — the cohort-parameterized version of
// load_tigerlc_stats_table.mjs. Kept verbatim (Feature + MeanExpression_<type> +
// PercentageExpression_<type> columns; cell-type names may contain spaces),
// separate from our computed per-gene stats tables. Narrow (a few thousand
// rows), so plain read_csv_auto — no chunking.
//
// Run under node 18 with duckdb 0.9.x, backend stopped (read-write needs
// exclusive access):
//   node database/load_stats_table.mjs <db_path> <stats_csv> <table>
import { createRequire } from "node:module";
const require = createRequire(new URL("../server/package.json", import.meta.url));
const duckdb = require("duckdb");

const dbPath = process.argv[2];
const csv = process.argv[3];
const table = process.argv[4];
if (!dbPath || !csv || !table) {
  console.error("usage: node load_stats_table.mjs <db_path> <stats_csv> <table>");
  process.exit(1);
}
if (!/^[a-z_][a-z0-9_]*$/.test(table)) {
  console.error("table name must be lower_snake_case:", table);
  process.exit(1);
}

const db = new duckdb.Database(dbPath); // read-write
const run = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => (e ? rej(e) : res(r))));
const path = csv.replace(/'/g, "''");
const q = (id) => `"${id.replace(/"/g, '""')}"`;

await run(`DROP TABLE IF EXISTS ${q(table)}`);
await run(`CREATE TABLE ${q(table)} AS SELECT * FROM read_csv_auto('${path}', sample_size=-1)`);
const [{ c }] = await run(`SELECT count(*) AS c FROM ${q(table)}`);
const cols = await run(
  `SELECT column_name FROM information_schema.columns WHERE table_name='${table}' ORDER BY ordinal_position`
);
console.log(`${table} rows:`, Number(c));
console.log("columns:", cols.map((r) => r.column_name).join(", "));
db.close(() => {});
