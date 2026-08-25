// dev-seed.mjs — generate a SYNTHETIC, schema-correct DuckDB for local development.
//
// The app serves a prebuilt read-only DuckDB at data/scatlaslc.db (gitignored,
// distributed out-of-band — EFS/S3 in deployed tiers). When you don't have the real
// file or its R-pipeline source data (database/source/*), this seeds a placeholder so
// the backend boots and the single-cell cohort pages render with FAKE data.
//
// It mirrors database/import.sql's 18 tables and the columns the client queries
// (cell: x,y,type,<gene...>; stats: gene,count,percent,mean,stdev,stderr).
//
// ⚠ NOT real data. Replace data/scatlaslc.db with the real artifact for anything real.
//
// Usage (needs duckdb 0.9.x — matches the backend reader — and node 18):
//   cd database && npm init -y && npm install duckdb@0.9.1
//   node dev-seed.mjs ../data/scatlaslc.db
import duckdb from "duckdb";

const OUT = process.argv[2];
if (!OUT) throw new Error("usage: node dev-seed.mjs <output.db>");

let seed = 1234567;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = (mu, sd) => {
  const u = Math.max(rnd(), 1e-9), v = rnd();
  return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const GENES = [
  "ALB", "GPC3", "AFP", "CD3D", "CD8A", "CD4", "FOXP3", "PTPRC", "EPCAM",
  "KRT19", "VIM", "COL1A1", "PECAM1", "CD68", "MARCO", "CD79A", "MS4A1",
  "NKG7", "GNLY", "IL7R", "MKI67", "SPP1", "APOA1", "SERPINA1",
];

const DATASETS = [
  { name: "normal_cell", types: ["Hepatocyte", "Endothelial", "Stromal", "Cholangiocyte"] },
  { name: "tumor_cell", types: ["Malignant 1", "Malignant 2", "Malignant 3"] },
  { name: "t_cell", types: ["CD4 T", "CD8 T", "Treg", "NK"] },
  { name: "cd4_cell", types: ["Naive", "Memory", "Treg"] },
  { name: "cd8_cell", types: ["Naive", "Effector", "Exhausted"] },
  { name: "longitudinal_normal_cell", types: ["Hepatocyte", "Immune", "Stromal"] },
  { name: "longitudinal_tumor_cell", types: ["S1", "S2", "S3"] },
  { name: "multiregional_normal_cell", types: ["Hepatocyte", "Immune", "Stromal"] },
  { name: "multiregional_tumor_cell", types: ["R1", "R2", "R3"] },
];

const N = 600; // rows per cell table
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const sq = (s) => `'${String(s).replace(/'/g, "''")}'`;

const db = new duckdb.Database(OUT);
const con = db.connect();
const run = (sql) => new Promise((res, rej) => con.run(sql, (e) => (e ? rej(e) : res())));

function cellRows(types) {
  const centers = types.map((_, i) => {
    const a = (2 * Math.PI * i) / types.length;
    return [10 * Math.cos(a), 10 * Math.sin(a)];
  });
  const rows = [];
  for (let r = 0; r < N; r++) {
    const ti = Math.floor(rnd() * types.length);
    const [cx, cy] = centers[ti];
    const x = gauss(cx, 2.2).toFixed(4);
    const y = gauss(cy, 2.2).toFixed(4);
    const vals = GENES.map(() => (rnd() < 0.6 ? 0 : +Math.abs(gauss(1.5, 1)).toFixed(4)));
    rows.push(`(${x}, ${y}, ${sq(types[ti])}, ${vals.join(", ")})`);
  }
  return rows;
}

function statsRows() {
  return GENES.map((g) => {
    const count = Math.floor(rnd() * (N - 50)) + 50;
    const percent = +((100 * count) / N).toFixed(2);
    const mean = +Math.abs(gauss(1.2, 0.6)).toFixed(4);
    const stdev = +Math.abs(gauss(0.8, 0.3)).toFixed(4);
    const stderr = +(stdev / Math.sqrt(N)).toFixed(6);
    return `(${sq(g)}, ${count}, ${percent}, ${mean}, ${stdev}, ${stderr})`;
  });
}

const geneCols = GENES.map((g) => `${q(g)} DOUBLE`).join(", ");

for (const { name, types } of DATASETS) {
  await run(`DROP TABLE IF EXISTS ${q(name)}`);
  await run(`CREATE TABLE ${q(name)} (x DOUBLE, y DOUBLE, type VARCHAR, ${geneCols})`);
  await run(`INSERT INTO ${q(name)} VALUES ${cellRows(types).join(",\n")}`);

  const stats = `${name}_stats`;
  await run(`DROP TABLE IF EXISTS ${q(stats)}`);
  await run(
    `CREATE TABLE ${q(stats)} (gene VARCHAR, count BIGINT, percent DOUBLE, mean DOUBLE, stdev DOUBLE, stderr DOUBLE)`,
  );
  await run(`INSERT INTO ${q(stats)} VALUES ${statsRows().join(",\n")}`);
  console.log(`  built ${name} (${N} rows) + ${stats} (${GENES.length} genes)`);
}

await new Promise((res) => db.close(() => res()));
console.log(`done -> ${OUT}`);
