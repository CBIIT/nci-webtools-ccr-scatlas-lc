import { createSingleCellCohortState } from "../single-cell-cohort-state";
import SingleCellCohortPage from "../single-cell-cohort-page";

// NCI-CLARITY T-Cell cohort: a full-width T-cells panel on one tab, the
// CD4+/CD8+ pair (with their subtype annotations) on the other. Values
// carried over verbatim from the legacy t-cell module; the annotations keep
// their hardcoded data coordinates.
const subtypeAnnotation = (x, y, text) => ({
  x,
  y,
  text: `<b>${text}</b>`,
  showarrow: false,
  font: { size: 16 },
});

const state = createSingleCellCohortState({
  id: "scTCell",
  countsTitle: "T-Cell Counts",
  defaultGene: "EPCAM",
  // the legacy T-Cell table says "Level" where the other cohorts say "Levels"
  countsHeaders: { mean: "Normalized Expression Level" },
  panels: [
    {
      id: "tcell",
      label: "T Cells",
      countsLabel: "T Cells",
      countsAria: "T Cell",
      table: "t_cell",
      statsTable: "t_cell_stats",
      colors: null,
      axes: { x: "t-SNE 1", y: "t-SNE 2" },
      initialRange: { x: [-70, 70], y: [-90, 90] },
      legend: { title: "Type", hint: "Click legend to show/hide types" },
      layout: { col: 12, width: "1000px" },
    },
    {
      id: "cd4",
      label: "CD4+ T Cells",
      countsLabel: "CD4+",
      countsAria: "CD4+",
      table: "cd4_cell",
      statsTable: "cd4_cell_stats",
      colors: null,
      axes: { x: "t-SNE 1", y: null },
      initialRange: { x: [-15, 10], y: null },
      legend: { title: "Type", hint: "Click legend to show/hide types" },
      annotations: [
        subtypeAnnotation(-11, 3, "Cytotoxic"),
        subtypeAnnotation(4, 10, "Exhausted"),
        subtypeAnnotation(8, -4, "Naive"),
      ],
    },
    {
      id: "cd8",
      label: "CD8+ T Cells",
      countsLabel: "CD8+",
      countsAria: "CD8+",
      table: "cd8_cell",
      statsTable: "cd8_cell_stats",
      colors: null,
      axes: { x: "t-SNE 1", y: null },
      initialRange: { x: [-15, 10], y: null },
      legend: { title: "Type", hint: "Click legend to show/hide types" },
      annotations: [
        subtypeAnnotation(-11, -1, "Cytotoxic"),
        subtypeAnnotation(2, -12, "Exhausted"),
        subtypeAnnotation(6, 5, "Naive"),
      ],
    },
  ],
  tabs: [
    { id: "tcell", label: "T-Cell", panelIds: ["tcell"] },
    { id: "cd4/8", label: "CD4/CD8", panelIds: ["cd4", "cd8"] },
  ],
  countsColumns: ["tcell", "cd4", "cd8"],
});

export default function TCellCohort() {
  return <SingleCellCohortPage state={state} />;
}
