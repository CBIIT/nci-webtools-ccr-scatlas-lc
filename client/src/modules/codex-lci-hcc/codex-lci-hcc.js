import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";

// Spatial LCI HCC proteomics (CODEX) cohort — a configuration of the shared
// spatial-cohort template. 402k cells over 132 samples (~3k each, max ~10k):
// past the comfortable whole-table download size, but each sample is small,
// so it takes the TIGER-LC iCCA proteomics treatment — per-sample fetching
// with SVG scatter (no WebGL contexts to ration). Same 16-marker CODEX panel
// as TIGER-LC HCC: raw fluorescence values, slide-pixel coordinates, and no
// EPCAM, so E-cadherin is the default feature.
const state = createSpatialCohortState({
  id: "codexLciHcc",
  title: "LCI HCC",
  tables: {
    cells: "codex_lci_hcc",
    stats: "codex_lci_hcc_stats",
    statsTable: "codex_lci_hcc_stats_table",
  },
  // the TIGER-LC HCC palette, minus the phenotype clusters this cohort lacks
  cellTypeColors: {
    "B cell": "#9467BD",
    "CD44+": "#BCBD22",
    "CD45+": "#32CD32",
    DC: "#E377C2",
    Endothelial: "#FF8C00",
    "Ki67+": "#2F4F4F",
    Macrophage: "#8C564B",
    Malignant: "#EE2C2C",
    "T cell": "#17BECF",
    Unclassified: "#A9A9A9",
  },
  // display order of the statistics table's value columns — follows the
  // client's stats_table_lcihcc.csv column order
  statsTableTypes: [
    "Macrophage",
    "T cell",
    "CD45+",
    "Malignant",
    "CD44+",
    "Ki67+",
    "DC",
    "B cell",
    "Unclassified",
    "Endothelial",
  ],
  defaultGene: "E-cadherin",
  fetch: "perSample",
  // prettier-ignore
  samples: [
    "02402", "02404A", "03062", "03064", "03082", "03088", "03101", "03114",
    "03116", "03121A", "03146A", "03186block3reg1", "03196", "03205A", "03215",
    "03241", "03292", "03305", "03309", "03311", "03319", "03321", "03329A",
    "03335A", "03339", "03345A", "03360A", "03361", "03365",
    "03370Ablock3reg1", "03375", "03384A", "HLJ-402A", "LCS-008A", "LCS-017A",
    "LCS-018", "LCS-028Ablock3", "LCS-035block3reg3", "LCS-041A", "LCS-042",
    "LCS-045A", "LCS-049Ablock3", "LCS-054A", "LCS-063A", "LCS-070",
    "LCS-071Ablock3", "LCS-077", "LCS-120A", "LCS-125", "LCS-160A",
    "LCS-196block3", "LCS-245A", "LCS-254block3", "LCS-259A", "LCS-289A",
    "LCS-293", "LCS-295", "LCS-329", "LCS-330", "LCS-331", "LCS-339",
    "LCS-341", "LCS-342", "LCS-343", "LCS-344", "LCS-345", "LCS-346",
    "LCS-349", "LCS-354", "LCS-355", "LCS-356", "LCS-357", "LCS-360",
    "LCS-365", "LCS-370", "LCS-371", "LCS-373", "LCS-376", "LCS-378",
    "LCS-382", "LCS-385", "LCS-391", "LCS-395", "LCS-399", "LCS-400A",
    "LCS-401", "LCS-403", "LCS-404", "LCS-405", "LCS-406A", "LCS-413",
    "LCS-415", "LCS-420", "LCS-421", "LCS-422", "LCS-424", "LCS-425",
    "LCS-426", "LCS-427", "PN-13", "PN-14", "PN-17", "PN-20", "PN-24", "PN-26",
    "PN-27", "PN-29", "PN-30", "PN-33", "PN-34", "PN-35", "PN-38", "PN-40",
    "PT-13", "PT-14", "PT-15", "PT-17", "PT-18", "PT-20", "PT-21", "PT-23",
    "PT-24", "PT-27", "PT-28", "PT-30", "PT-31", "PT-32", "PT-34", "PT-35",
    "PT-36", "PT-5", "PT-6",
  ],
  renderer: "scatter",
  units: "px",
});

export default function CodexLciHcc() {
  return <SpatialCohortPage state={state} />;
}
