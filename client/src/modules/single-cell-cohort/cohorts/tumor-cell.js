import { createSingleCellCohortState } from "../single-cell-cohort-state";
import SingleCellCohortPage from "../single-cell-cohort-page";

// NCI-CLARITY Tumor Cell Community cohort: malignant and non-malignant cells,
// both on t-SNE. Values carried over verbatim from the legacy tumor-cell
// module (the malignant panel uses the shared default palette).
const state = createSingleCellCohortState({
  id: "scTumorCell",
  countsTitle: "Cell Counts",
  defaultGene: "EPCAM",
  panels: [
    {
      id: "tumor",
      label: "Malignant Cells",
      countsLabel: "Malignant",
      countsAria: "Tumor Cell",
      table: "tumor_cell",
      statsTable: "tumor_cell_stats",
      colors: null,
      axes: { x: "t-SNE 1", y: "t-SNE 2" },
      initialRange: { x: [-100, 100], y: [-100, 100] },
      legend: { title: "Case", hint: "Click legend to show/hide cases" },
    },
    {
      id: "normal",
      label: "Non-malignant Cells",
      countsLabel: "Non-Malignant",
      countsAria: "Normal Cell",
      table: "normal_cell",
      statsTable: "normal_cell_stats",
      colors: [
        "#4682B4",
        "#FF7F24",
        "#8B4513",
        "#ED82B4",
        "#F7EC37",
        "#EE2C2C",
        "#228B22",
      ],
      axes: { x: "t-SNE 1", y: "t-SNE 2" },
      initialRange: { x: [-100, 100], y: [-100, 100] },
      legend: { title: "Type", hint: "Click legend to show/hide types" },
    },
  ],
  tabs: null,
  countsColumns: ["tumor", "normal"],
});

export default function TumorCellCohort() {
  return <SingleCellCohortPage state={state} />;
}
