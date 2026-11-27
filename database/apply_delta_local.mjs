// Merge a delta's tables into a LOCAL DuckDB file — the local counterpart of
// apply_delta.sh (which does this on a tier via the Data Import workflow), so
// a delta can be rehearsed on the dev database before it ships. Each table in
// the delta replaces the table of the same name; nothing else is touched.
//
// Cell tables are copied one sample at a time, as on the tier: it bounds
// memory, and it leaves each table clustered by sample, which is what the
// per-sample pages filter on. Even so, one sample of a 1,000-gene CosMx table
// is a few GB in flight, so the memory limit is sized for a workstation, with
// a temp directory beside the database for anything that has to spill.
//
// Stop anything holding the database open (the local backend) first — a
// read-only reader blocks the write lock.
//
// Usage: node apply_delta_local.mjs <db_path> <delta_path> [table ...]
//   (no tables given: every table in the delta)
import { createRequire } from "node:module";
const require = createRequire(new URL("../server/package.json", import.meta.url));
const duckdb = require("duckdb");

const [dbPath, deltaPath, ...only] = process.argv.slice(2);
if (!dbPath || !deltaPath) {
  console.error("usage: node apply_delta_local.mjs <db_path> <delta_path> [table ...]");
  process.exit(1);
}
const db = new duckdb.Database(dbPath); // read-write
const run = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => (e ? rej(e) : res(r))));
const q = (id) => `"${id.replace(/"/g, '""')}"`;
const path = deltaPath.replace(/'/g, "''");

await run("SET memory_limit='10GB'");
await run(`SET temp_directory='${dbPath.replace(/'/g, "''")}.tmp'`);
await run("SET preserve_insertion_order=false");
await run(`ATTACH '${path}' AS src (READ_ONLY)`);
const inDelta = (
  await run(
    // information_schema spans every attached database, so the delta's
    // tables are picked out by catalog
    "SELECT table_name FROM information_schema.tables WHERE table_catalog='src' AND table_schema='main' ORDER BY table_name"
  )
).map((r) => r.table_name);
const tables = only.length ? only : inDelta;
for (const t of tables) {
  if (!inDelta.includes(t)) throw new Error(`not in the delta: ${t}`);
  if (!/^[a-z_][a-z0-9_]*$/.test(t)) throw new Error(`table name must be lower_snake_case: ${t}`);
}
console.log("applying:", tables.join(", "));

for (const t of tables) {
  const [{ n }] = await run(`SELECT count(*) AS n FROM src.${q(t)}`);
  const hasSample = (
    await run(
      `SELECT count(*) AS c FROM information_schema.columns WHERE table_catalog='src' AND table_schema='main' AND table_name='${t}' AND column_name='sample'`
    )
  )[0].c;
  await run(`DROP TABLE IF EXISTS ${q(t)}`);
  await run(`CREATE TABLE ${q(t)} AS SELECT * FROM src.${q(t)} LIMIT 0`);
  if (Number(hasSample) === 1 && Number(n) > 100000) {
    const samples = (await run(`SELECT DISTINCT sample FROM src.${q(t)} ORDER BY sample`)).map(
      (r) => r.sample
    );
    for (const s of samples) {
      await run(
        `INSERT INTO ${q(t)} SELECT * FROM src.${q(t)} WHERE sample = '${String(s).replace(/'/g, "''")}'`
      );
      await run("CHECKPOINT");
      process.stdout.write(`  ${t}: ${s}\n`);
    }
  } else {
    await run(`INSERT INTO ${q(t)} SELECT * FROM src.${q(t)}`);
  }
  const [{ c }] = await run(`SELECT count(*) AS c FROM ${q(t)}`);
  if (Number(c) !== Number(n)) throw new Error(`${t}: copied ${c} of ${n} rows`);
  console.log(`${t}: ${Number(c)} rows`);
}
await run("CHECKPOINT");
db.close(() => {});
