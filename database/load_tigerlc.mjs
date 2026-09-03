// Load the TIGER-LC CSV chunks (from import_tigerlc.R) into a typed
// `tigerlc` table in an existing DuckDB file.
//
// MUST be run with duckdb 0.9.x (the version the backend reads) so the on-disk
// file format stays compatible — a newer duckdb would upgrade the file and the
// 0.9.1 backend could no longer open it. Run under node 18 from the server dir:
//   node ../database/load_tigerlc.mjs <db_path> <chunk_dir>
// The backend must be stopped first (a read-write open needs exclusive access).
//
// We build an explicit typed schema (meta columns + every gene as DOUBLE) and
// COPY each chunk in, rather than read_csv_auto — auto type-detection on 6,175
// mostly-zero gene columns can mis-infer integer and then fail on a float.
import { openSync, readSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

// Resolve duckdb from the server's node_modules — it pins 0.9.x, the on-disk
// format the backend reads. (ESM would otherwise resolve from this script's
// own folder, which has no node_modules.)
const require = createRequire(new URL("../server/package.json", import.meta.url));
const duckdb = require("duckdb");

const dbPath = process.argv[2];
const chunkDir = process.argv[3];
if (!dbPath || !chunkDir) {
  console.error("usage: node load_tigerlc.mjs <db_path> <chunk_dir>");
  process.exit(1);
}

const files = readdirSync(chunkDir)
  .filter((f) => /^tigerlc_\d+\.csv$/.test(f))
  .sort();
if (!files.length) {
  console.error("no tigerlc_*.csv chunks in", chunkDir);
  process.exit(1);
}

// read just the header line from the first chunk to get column names in order
function readHeader(path) {
  const fd = openSync(path, "r");
  const buf = Buffer.alloc(1 << 20); // 1 MB is plenty for one header line
  const n = readSync(fd, buf, 0, buf.length, 0);
  const text = buf.toString("utf8", 0, n);
  return text.slice(0, text.indexOf("\n")).trim();
}
const cols = readHeader(join(chunkDir, files[0])).split(",");
const META_TYPES = { cell_id: "VARCHAR", x: "DOUBLE", y: "DOUBLE", type: "VARCHAR", sample: "VARCHAR" };
const q = (id) => `"${id.replace(/"/g, '""')}"`;
const ddl = cols.map((c) => `${q(c)} ${META_TYPES[c] || "DOUBLE"}`).join(", ");

const db = new duckdb.Database(dbPath); // read-write
const run = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => (e ? rej(e) : res(r))));

// This table is very wide (6,175 gene cols) AND tall (270k cells), so building it
// can exhaust RAM. Cap memory and give DuckDB a disk spill dir; don't preserve
// insertion order (halves the buffering); checkpoint after each chunk so each
// row group is flushed to disk and its memory released before the next load.
const memLimit = process.env.DUCKDB_MEMORY_LIMIT || "8GB";
const tmpDir = (process.env.DUCKDB_TEMP_DIR || join(chunkDir, "duckdb_tmp")).replace(/'/g, "''");
await run(`SET memory_limit='${memLimit}'`);
await run(`SET temp_directory='${tmpDir}'`);
await run("SET threads TO 2");
await run("SET preserve_insertion_order=false");

console.log(`${cols.length} columns (${cols.length - 5} genes); ${files.length} chunks; mem ${memLimit}`);
await run("DROP TABLE IF EXISTS tigerlc");
await run(`CREATE TABLE tigerlc (${ddl})`);
for (const f of files) {
  const path = join(chunkDir, f).replace(/'/g, "''");
  await run(`COPY tigerlc FROM '${path}' (FORMAT CSV, HEADER true)`);
  await run("CHECKPOINT");
  process.stdout.write(`  loaded ${f}\n`);
}
const [{ c }] = await run("SELECT count(*) AS c FROM tigerlc");
const [{ s }] = await run("SELECT count(DISTINCT sample) AS s FROM tigerlc");
const types = await run("SELECT type, count(*) AS n FROM tigerlc GROUP BY type ORDER BY type");
console.log("tigerlc rows:", Number(c), "| samples:", Number(s));
console.log("cell types:", types.map((t) => `${t.type}=${Number(t.n)}`).join(", "));
db.close(() => {});
