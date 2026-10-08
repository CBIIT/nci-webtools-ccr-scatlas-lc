import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";
import {
  B_CELL,
  BROWN,
  ENDOTHELIAL,
  EPITHELIAL,
  GOLD,
  GREEN,
  IMMUNE,
  MACROPHAGE,
  MALIGNANT,
  NAVY,
  OLIVE,
  PINK,
  T_CELL,
  UNCLASSIFIED,
} from "../spatial-cohort/cell-type-palette";

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
  // the shared palette: the types that recur across cohorts in their own
  // colors (CD45+, the pan-immune cluster, in the untyped-immune magenta);
  // the phenotype clusters unique to this panel in the spare ones, plus the
  // fibroblast green, free here because the panel types no fibroblasts. With
  // 14 types this is the page that uses every color in the palette.
  cellTypeColors: {
    "B cell": B_CELL,
    "CD163+CD20+CD31+": BROWN,
    "CD31+CD20+": NAVY,
    "CD44+": OLIVE,
    "CD45+": IMMUNE,
    DC: PINK,
    "E-cadherin+CD8+": GOLD,
    Endothelial: ENDOTHELIAL,
    Epithelial: EPITHELIAL,
    "Ki67+": GREEN,
    Macrophage: MACROPHAGE,
    Malignant: MALIGNANT,
    "T cell": T_CELL,
    Unclassified: UNCLASSIFIED,
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
  // a protein panel: the page reads Protein wherever it would read Gene
  featureNoun: "protein",
  fetch: "full",
  samples: null,
    // client-chosen sample the Samples filter starts with (9/4 feedback)
  defaultSelectedSamples: ["518_T"],
  renderer: "scatter",
  units: "px",
});

export default function CodexTigerLcHcc() {
  return <SpatialCohortPage state={state} />;
}
