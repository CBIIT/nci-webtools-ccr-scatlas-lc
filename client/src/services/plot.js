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

// The color scale's range for a set of expression values, given their
// extent. Expression is never negative, so the scale starts at 0 — the true
// floor — whatever the smallest value present; should a table ever carry
// negatives, the floor follows them down. The ceiling is the largest value,
// but always above the floor: handed an empty range (a gene no shown cell
// expresses is 0 to 0), Plotly pads it by half a unit each way and the
// colorbar reads -0.5 to 0.5, values the data cannot take.
export function colorRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [null, null];
  const floor = Math.min(0, min);
  return [floor, max > floor ? max : floor + 1];
}

export function getTraces(records, config, gene, colorArray = colors) {
  const valueIndex = gene || "type";
  const groups = groupBy(records, "type");
  const [minValue, maxValue] = gene
    ? colorRange(...extent(records.map((r) => r[valueIndex])))
    : [null, null];
  const formatNumber = (value, precision = 4) =>
    isNumber(value) ? +value.toPrecision(precision) : value;

  const toReturn = Object.entries(groups)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, values], i) => {
      return merge(
        {
          name: key,
          x: values.map((v) => v.x),
          y: values.map((v) => v.y),
          text: values.map((v) => formatNumber(v[valueIndex])),
          // cell id (when present) for per-point hover; ignored unless a trace
          // sets a hovertemplate referencing %{customdata}
          customdata: values.map((v) => v.cell_id),
          mode: "markers",
          type: "scattergl",
          hoverinfo: "text+name",
          marker: {
            color: !gene
              ? colorArray[i % colorArray.length]
              : values.map((v) => v[valueIndex]),
            cmin: minValue,
            cmax: maxValue,
            showscale: i === 0,
          },
        },
        config,
      );
    });

  return toReturn;
}

export function hasWebglSupport() {
  try {
    const canvas = document.createElement("canvas");
    return (
      !!window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}
