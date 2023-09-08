import { promisify } from "util";

/**
 * Quote a string for use in a SQL query
 * @param {string} str
 * @returns
 */
export function quote(str) {
  return `"${str.replace('"', '\\"')}"`;
}

/**
 * Return a schema object for the given database
 * @param {import("duckdb").Database} db
 * @returns {Promise<{[key: string]: any[]}>
 */
export async function getSchema(db) {
  const run = promisify(db.all.bind(db));
  const schema = {};
  const tables = await run(
    "select table_name as name from information_schema.tables",
  );
  for (const { name } of tables) {
    const columns = await run(
      "select column_name as name from information_schema.columns where table_name = ?",
      [name],
    );
    schema[name] = columns.map((column) => column.name);
  }
  return schema;
}

/**
 * Filters/validates table and columns against the schema
 * @param {any} schema
 * @param {string} dataset
 * @param {string[]} columns
 * @returns {{dataset: string, columns: string[]}
 */
export function validate(schema, table, columns) {
  if (!schema[table] || !Array.isArray(schema[table])) {
    throw new Error(`Invalid table`);
  }
  const validColumns = columns.filter((column) =>
    schema[table].some((validColumn) => column === validColumn),
  );
  if (!validColumns.length) {
    throw new Error(`Invalid columns`);
  }
  return { table, columns: validColumns };
}

/**
 * Generate an escaped SQL query string for the given table and columns
 * @param {any} schema
 * @param {string} table
 * @param {string[]} columns
 * @returns {string} An escaped SQL query string
 */
export function getQuery(schema, table, columns) {
  const valid = validate(schema, table, columns);
  const validColumns = valid.columns.map(quote).join(", ");
  const validTable = quote(valid.table);
  return `select ${validColumns} from ${validTable}`;
}
