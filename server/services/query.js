module.exports = { query };

function query(database, params) {
  // enable read-only mode
  database.pragma("query_only = ON");
  const ifDefined = (value, statement, defaultValue = "") =>
    value ? statement : defaultValue;
  let { table, offset, limit, order, orderBy, columns, distinct, count, raw } =
    params;

  // validate provided table
  const isValidTable =
    database
      .prepare(
        `SELECT COUNT(*) FROM sqlite_master
        WHERE tbl_name = :table`,
      )
      .pluck()
      .get({ table }) > 0;

  if (!table || !isValidTable) throw new Error("Please provide a valid table");

  // retrieve column metadata
  const columnNames = database
    .prepare(`pragma table_info('${table}')`)
    .all()
    .map((c) => c.name);

  // determine filters (eg: _column:eq=value)
  const filters = Object.entries(params)
    .filter(([key]) => key.startsWith("_"))
    .map(([_key, value]) => {
      // {'column:filter_type': value}
      const [key, type] = _key.split(":");
      return [key.replace(/^_/, ""), value, type || "eq"];
    })
    .filter(([key]) => columnNames.includes(key));

  // map filters to an object containing {placeholder: value} props
  let queryParams = {};
  filters.forEach(([key, value, type]) => {
    if (type === "like") {
      queryParams[`${key}_${type}`] = `%${value}%`;
    } else if (["in", "between"].includes(type)) {
      value
        .split(",")
        .forEach((val, i) => (queryParams[`${key}_${type}_${i}`] = val));
    } else {
      queryParams[`${key}_${type}`] = value;
    }
  });

  // columns, table, order, and orderBy must be sanitized/validated
  // since they can not be bound parameters
  columns = !columns
    ? columnNames
    : columns
        .split(",")
        .map((s) => s.trim())
        .filter((column) => columnNames.includes(column));

  if (order && !/^(asc|desc)$/i.test(order)) order = "asc";

  if (orderBy && !columnNames.includes(orderBy)) orderBy = columns[0];

  let conditions = ifDefined(
    filters.length,
    `WHERE ${filters
      .map(
        ([key, value, type]) => `
                ${key} 
                ${
                  {
                    // operator
                    like: "LIKE",
                    between: "BETWEEN",
                    in: "IN",
                    eq: "=",
                    gt: ">",
                    gte: ">=",
                    lt: "<",
                    lte: "<=",
                  }[type] || "="
                } 
                ${
                  {
                    // placeholder
                    in: `(${value
                      .split(",")
                      .map((_, i) => `:${key}_${type}_${i}`)})`,
                    between: value
                      .split(",")
                      .map((_, i) => `:${key}_${type}_${i}`)
                      .join(" AND "),
                  }[type] || `:${key}_${type}`
                }
            `,
      )
      .join(" AND ")}`,
  );

  const queryColumns = columns.map((c) => `"${c}"`).join(",");

  const statement = database.prepare(
    `SELECT ${ifDefined(distinct, "DISTINCT")} ${queryColumns}
        FROM "${table}" ${conditions}
        ${ifDefined(order && orderBy, `ORDER BY ${orderBy} ${order}`)} 
        ${ifDefined(limit, `LIMIT :limit`)}
        ${ifDefined(offset, `OFFSET :offset`)}`,
  );

  let result = {
    orderBy,
    order,
    offset,
    limit,
    filters: filters
      .map(([key, value, type]) => [`_${key}:${type}`, value])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    columns: statement.columns().map((c) => c.name),
    records: statement.raw(Boolean(raw)).all({ offset, limit, ...queryParams }),
  };

  if (count) {
    result.count = database
      .prepare(
        `SELECT COUNT(*) FROM (
                SELECT ${ifDefined(distinct, "DISTINCT")} ${queryColumns} 
                FROM "${table}" ${conditions}
            )`,
      )
      .pluck()
      .get(queryParams);
  }

  return result;
}
