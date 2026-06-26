import { useRecoilValue } from "recoil";
import Plot from "react-plotly.js";
import merge from "lodash/merge";
import { getTraces } from "../../services/plot";
import {
  plotOptionsState,
  cellsQuery,
  featureExpressionQuery,
} from "./tiger-lc.state";

// Colors for the four cell types, in getTraces' sorted (alphabetical) group order:
// Epithelial, Immune, Malignant, Stromal.
const cellTypeColors = ["#3A5FCD", "#FF8C00", "#EE2C2C", "#32CD32"];

export default function TigerLcPlots() {
  const cells = useRecoilValue(cellsQuery);
  const { size, opacity, activeFeature, samples } =
    useRecoilValue(plotOptionsState);
  // a feature (single gene or gene set) colors the plot by its per-cell mean
  // (__value); no feature -> color by cell type
  const genesKey = activeFeature ? activeFeature.genes.join(",") : "";
  const featureRecords = useRecoilValue(featureExpressionQuery(genesKey));
  const base = activeFeature ? featureRecords : cells;
  // samples: null = all; otherwise keep only cells in the selected samples
  const sampleSet = samples == null ? null : new Set(samples);
  const records = sampleSet
    ? base.filter((r) => sampleSet.has(r.sample))
    : base;
  const valueIndex = activeFeature ? "__value" : null;
  const isSet = activeFeature?.kind === "set";

  // Spatial scatter: x/y are real slide millimetres, so keep an equal aspect ratio
  // (scaleanchor) to avoid distorting the tissue.
  const layout = {
    xaxis: {
      title: "Spatial X (mm)",
      zeroline: false,
      scaleanchor: "y",
      scaleratio: 1,
      constrain: "domain",
    },
    yaxis: { title: "Spatial Y (mm)", zeroline: false },
    legend: { itemsizing: "constant", itemwidth: 40 },
    hovermode: "closest",
    uirevision: genesKey || 1,
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    toImageButtonOptions: {
      format: "svg",
      filename: "tigerlc_plot",
      height: 1000,
      width: 1000,
      scale: 1,
    },
    modeBarButtonsToRemove: [
      "select2d",
      "lasso2d",
      "hoverCompareCartesian",
      "hoverClosestCartesian",
    ],
  };

  const traceConfig = {
    showlegend: !activeFeature,
    // show the cell id on hover (AC #4), plus the cell type or feature value
    hovertemplate: activeFeature
      ? `Cell ID: %{customdata}<br>${activeFeature.label}: %{text}<extra></extra>`
      : `Cell ID: %{customdata}<br>Cell type: %{fullData.name}<extra></extra>`,
    hoverlabel: { namelength: -1 },
    marker: {
      size,
      opacity,
      colorbar: { thickness: 20 },
      ...(!activeFeature && { showscale: false }),
    },
  };

  // label a multi-gene set's coloring as a mean so it isn't read as single-gene expression
  const featureLabel = activeFeature
    ? `${activeFeature.label}${isSet ? ` (mean, ${activeFeature.genes.length} genes)` : ""}`
    : " — Cell Types";

  return (
    <Plot
      data={getTraces(records, traceConfig, valueIndex, cellTypeColors)}
      layout={merge({}, layout, {
        title: `<b>TIGER-LC${activeFeature ? `: ${featureLabel}` : featureLabel} (n=${records.length})</b>`,
        legend: {
          title: { text: activeFeature ? "" : "Cell type", font: { size: 14 } },
        },
      })}
      config={config}
      useResizeHandler
      className="w-100"
      style={{ height: "800px" }}
    />
  );
}
