import { createSingleCellCohortState } from "../single-cell-cohort-state";
import SingleCellCohortPage from "../single-cell-cohort-page";

// Sequential (longitudinal) cohort: malignant and non-malignant cells, both
// on t-SNE. Values carried over verbatim from the legacy sequential module
// (whose counts headers spelled "Maligant" — fixed here).
const state = createSingleCellCohortState({
  id: "scSequential",
  countsTitle: "Cell Counts",
  defaultGene: "EPCAM",
  panels: [
    {
      id: "tumor",
      label: "Malignant Cells",
      countsLabel: "Malignant",
      countsAria: "Tumor Cell",
      table: "longitudinal_tumor_cell",
      statsTable: "longitudinal_tumor_cell_stats",
      colors: [
        "#CD69C9",
        "#8B4789",
        "#D02090",
        "#B4CDCD",
        "#FF7F24",
        "#CD661D",
        "#8B4513",
        "#FCBBA1",
        "#FC9272",
        "#FB6A4A",
        "#CB181D",
        "#CDBE70",
        "#8B814C",
        "#90EE90",
        "#008B00",
        "#006400",
        "#63B8FF",
        "#4682B4",
        "#4876FF",
        "#27408B",
        "#551A8B",
        "#7FFFD4",
        "#458B74",
      ],
      axes: { x: "t-SNE 1", y: "t-SNE 2" },
      initialRange: { x: [-50, 65], y: [-70, 70] },
      legend: { title: "Case", hint: "Click legend to show/hide cases" },
    },
    {
      id: "normal",
      label: "Non-malignant Cells",
      countsLabel: "Non-Malignant",
      countsAria: "Normal Cell",
      table: "longitudinal_normal_cell",
      statsTable: "longitudinal_normal_cell_stats",
      colors: [
        "#4682B4",
        "#FF7F24",
        "#8B4513",
        "#ED82B4",
        "#228B22",
        "#F7EC37",
        "#EE2C2C",
        "#BEBEBE",
      ],
      axes: { x: "t-SNE 1", y: "t-SNE 2" },
      initialRange: { x: [-45, 45], y: [-70, 70] },
      legend: { title: "Type", hint: "Click legend to show/hide types" },
    },
  ],
  tabs: null,
  countsColumns: ["tumor", "normal"],
});

export default function SequentialCohort() {
  return <SingleCellCohortPage state={state} />;
}
