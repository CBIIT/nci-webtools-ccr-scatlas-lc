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

// Plotly's own default for values that are never negative ("Reds"), spelled
// out so a narrowed range can be drawn from it
export const EXPRESSION_COLORSCALE = [
  [0, "rgb(220,220,220)"],
  [0.2, "rgb(245,195,157)"],
  [0.4, "rgb(245,160,105)"],
  [1, "rgb(178,10,28)"],
];

// A color scale whose gradient runs between two points of the value range
// (`lo` and `hi`, as fractions of it) instead of across all of it: everything
// below `lo` takes the first color, everything above `hi` the last. The range
// itself (cmin/cmax) is left alone, so the colorbar keeps its full axis and
// shows where the gradient now sits on it.
export function narrowedColorscale(scale, lo, hi) {
  if (lo <= 0 && hi >= 1) return scale;
  const stops = scale.map(([at, color]) => [lo + at * (hi - lo), color]);
  if (lo > 0) stops.unshift([0, scale[0][1]]);
  if (hi < 1) stops.push([1, scale[scale.length - 1][1]]);
  return stops;
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
