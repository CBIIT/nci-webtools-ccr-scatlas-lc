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
 * Generate an escaped SQL query for the given table and columns, optionally
 * filtered to a single sample. The filter is only valid for tables that have
 * a `sample` column; the value is bound as a query parameter, never
 * interpolated into the SQL.
 * @param {any} schema
 * @param {string} table
 * @param {string[]} columns
 * @param {string} [sample]
 * @returns {{sql: string, params: string[]}}
 */
export function getQuery(schema, table, columns, sample) {
  const valid = validate(schema, table, columns);
  const validColumns = valid.columns.map(quote).join(", ");
  const validTable = quote(valid.table);
  let sql = `select ${validColumns} from ${validTable}`;
  const params = [];
  if (sample != null && sample !== "") {
    if (!schema[valid.table].includes("sample")) {
      throw new Error(`Invalid filter`);
    }
    sql += ` where ${quote("sample")} = ?`;
    params.push(sample);
  }
  return { sql, params };
}
