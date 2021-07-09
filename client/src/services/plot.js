import groupBy from "lodash/groupBy";
import merge from "lodash/merge";
import isNumber from "lodash/isNumber";

function extent(array) {
  let min = array[0];
  let max = array[0];
  for (const item of array) {
    min = Math.min(min, item);
    max = Math.max(max, item);
  }
  return [min, max];
}

export function getTraces(
  { columns, records },
  { groupColumn, valueColumn },
  config,
) {
  const idIndex = columns.indexOf("id");
  const xIndex = columns.indexOf("x");
  const yIndex = columns.indexOf("y");
  const groupIndex = columns.indexOf(groupColumn);
  const valueIndex = columns.indexOf(valueColumn || groupColumn);
  const groups = groupBy(records, groupIndex);
  const [minValue, maxValue] = valueColumn
    ? extent(records.map((r) => r[valueIndex]))
    : [null, null];
  const formatNumber = (value, precision = 4) =>
    isNumber(value) ? +value.toPrecision(precision) : value;

  return Object.entries(groups).map(([key, values], i) =>
    merge(
      {
        name: key,
        ids: values.map((v) => String(v[idIndex])),
        x: values.map((v) => v[xIndex]),
        y: values.map((v) => v[yIndex]),
        text: values.map((v) => formatNumber(v[valueIndex])),
        mode: "markers",
        type: "scattergl",
        hoverinfo: "text+name",
        marker: {
          color: values.map((v) => v[valueIndex]),
          cmin: minValue,
          cmax: maxValue,
          showscale: i === 0,
        },
      },
      config,
    ),
  );
}
