import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";

// Spatial TIGER-LC HCC proteomics (CODEX) cohort — a configuration of the
// shared spatial-cohort template. At 133k cells over 116 samples (~1.1k each)
// this is the smallest spatial cohort, comfortably below TIGER-LC iCCA
// transcriptomics' full-fetch scale, so the whole table downloads once and
// rows render as SVG scatter. Values are raw CODEX fluorescence intensities
// and coordinates are slide pixels. The 16-marker panel has no EPCAM; the
// closest epithelial marker, E-cadherin, is the default feature instead.
const state = createSpatialCohortState({
  id: "codexTigerLcHcc",
  title: "TIGER-LC HCC",
  tables: {
    cells: "codex_tigerlc_hcc",
    stats: "codex_tigerlc_hcc_stats",
    statsTable: "codex_tigerlc_hcc_stats_table",
  },
  // shared hues for types that recur across cohorts (Epithelial blue,
  // Endothelial orange, Malignant red, B/T cell purple/cyan); the phenotype
  // clusters unique to this panel take the remaining distinct hues
  cellTypeColors: {
    "B cell": "#9467BD",
    "CD163+CD20+CD31+": "#654321",
    "CD31+CD20+": "#008B8B",
    "CD44+": "#BCBD22",
    "CD45+": "#32CD32",
    DC: "#E377C2",
    "E-cadherin+CD8+": "#FFD700",
    Endothelial: "#FF8C00",
    Epithelial: "#3A5FCD",
    "Ki67+": "#2F4F4F",
    Macrophage: "#8C564B",
    Malignant: "#EE2C2C",
    "T cell": "#17BECF",
    Unclassified: "#A9A9A9",
  },
  // display order of the statistics table's value columns — follows the
  // client's stats_table_tigerlc.csv column order
  statsTableTypes: [
    "Macrophage",
    "B cell",
    "Epithelial",
    "Endothelial",
    "T cell",
    "CD44+",
    "E-cadherin+CD8+",
    "CD45+",
    "DC",
    "Ki67+",
    "Malignant",
    "CD31+CD20+",
    "Unclassified",
    "CD163+CD20+CD31+",
  ],
  defaultGene: "E-cadherin",
  fetch: "full",
  samples: null,
  renderer: "scatter",
  units: "px",
});

export default function CodexTigerLcHcc() {
  return <SpatialCohortPage state={state} />;
}
