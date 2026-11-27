import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";
import {
  EPITHELIAL,
  FIBROBLAST,
  IMMUNE,
  MALIGNANT,
} from "../spatial-cohort/cell-type-palette";

// Spatial TIGER-LC iCCA cohort — a configuration of the shared spatial-cohort
// template. The cohort is small enough (~270k cells over ~130 samples) to
// download whole, so it uses full fetch with a global expression color scale,
// and SVG scatter rendering (~2k points per sample; WebGL contexts are
// browser-capped and were silently evicted with this many mounted rows).
const state = createSpatialCohortState({
  id: "tigerlc",
  title: "TIGER-LC iCCA",
  tables: {
    cells: "tigerlc",
    stats: "tigerlc_stats",
    statsTable: "tigerlc_stats_table",
  },
  cellTypeColors: {
    Epithelial: EPITHELIAL,
    Immune: IMMUNE,
    Malignant: MALIGNANT,
    Stromal: FIBROBLAST,
  },
  statsTableTypes: ["Malignant", "Immune", "Stromal", "Epithelial"],
  defaultGene: "EPCAM",
  fetch: "full",
  samples: null,
    // client-chosen sample the Samples filter starts with (9/4 feedback)
  defaultSelectedSamples: ["LCS571T_1"],
  renderer: "scatter",
});

export default function TigerLcCell() {
  return <SpatialCohortPage state={state} />;
}
