import groupBy from "lodash/groupBy";
import merge from "lodash/merge";
import isNumber from "lodash/isNumber";
import colors from "./colors.json";

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
  records,
  config,
  gene
) {
  const valueIndex = gene || "type";
  const groups = groupBy(records, "type");
  const [minValue, maxValue] = gene
    ? extent(records.map((r) => r[valueIndex]))
    : [null, null];
  const formatNumber = (value, precision = 4) =>
    isNumber(value) ? +value.toPrecision(precision) : value;

  return Object.entries(groups).map(([key, values], i) => {
    return (
      merge(
        {
          name: key,
          x: values.map((v) => v.x),
          y: values.map((v) => v.y),
          text: values.map((v) => formatNumber(v[valueIndex])),
          mode: "markers",
          type: "scattergl",
          hoverinfo: "text+name",
          marker: {
            color: !gene ? colors[i % colors.length] : values.map((v) => v[valueIndex]),
            cmin: minValue,
            cmax: maxValue,
            showscale: i === 0,
          },
        },
        config,
      )
    )
  }
  );
}
