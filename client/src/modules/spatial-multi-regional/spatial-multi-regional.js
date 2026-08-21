import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";

// Spatial Multi-Regional (CosMx) cohort — a configuration of the shared
// spatial-cohort template. At 2.35M cells over 15 samples (~20k–330k cells
// each) the cohort is far too large to download whole, so it uses per-sample
// fetching (each row loads on scroll via the query API's sample filter, with a
// per-row expression color scale) and WebGL rendering — SVG scatter cannot hold
// 100k+ points per plot. The mount window is tighter than the SVG default to
// keep concurrently mounted plots under the browser's WebGL context cap.
const state = createSpatialCohortState({
  id: "spatialMultiRegional",
  title: "Multi-Regional",
  tables: {
    cells: "multiregional",
    stats: "multiregional_stats",
    statsTable: "multiregional_stats_table",
  },
  cellTypeColors: {
    "B cell": "#9467BD",
    Endothelial: "#FF8C00",
    Epithelial: "#3A5FCD",
    Fibroblast: "#32CD32",
    Myeloid: "#EE2C2C",
    "T cell": "#17BECF",
  },
  // display order of the statistics table's value columns — follows the
  // client's stats_table_multiregional.csv column order
  statsTableTypes: [
    "Myeloid",
    "Fibroblast",
    "B cell",
    "Endothelial",
    "Epithelial",
    "T cell",
  ],
  defaultGene: "EPCAM",
  fetch: "perSample",
  samples: [
    "1CB", "1CT", "1HB", "1HT",
    "2CB", "2CT", "2HB", "2HT",
    "3CB", "3CT", "3HB", "3HT",
    "4HB", "4HN", "4HT",
  ],
  renderer: "scattergl",
  mountMargin: "200px",
  unmountMargin: "1000px",
});

export default function SpatialMultiRegional() {
  return <SpatialCohortPage state={state} />;
}
