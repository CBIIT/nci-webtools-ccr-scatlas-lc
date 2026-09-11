import { createSingleCellCohortState } from "../single-cell-cohort-state";
import SingleCellCohortPage from "../single-cell-cohort-page";

// Multi-Regional cohort: malignant cells on t-SNE, non-malignant on UMAP.
// Values (colors, ranges, wording) carried over verbatim from the legacy
// multi-regional module.
const state = createSingleCellCohortState({
  id: "scMultiRegional",
  countsTitle: "Cell Counts",
  defaultGene: "EPCAM",
  panels: [
    {
      id: "tumor",
      label: "Malignant Cells",
      countsLabel: "Malignant",
      countsAria: "Tumor Cell",
      table: "multiregional_tumor_cell",
      statsTable: "multiregional_tumor_cell_stats",
      colors: [
        "#FFD700",
        "#FF8C00",
        "#8B5A00",
        "#ADFF2F",
        "#32CD32",
        "#00868B",
        "#D3D3D3",
        "#7A7A7A",
        "#00EEEE",
        "#B0C4DE",
        "#3A5FCD",
        "#FFC0CB",
        "#CD919E",
        "#EEAEEE",
        "#FF00FF",
        "#AB82FF",
        "#551A8B",
      ],
      axes: { x: "t-SNE 1", y: "t-SNE 2" },
      initialRange: { x: [-45, 45], y: [-40, 40] },
      legend: {
        title: "Case",
        hint: "Click legend to show/hide cases",
        traceOrder: "reverse",
      },
    },
    {
      id: "normal",
      label: "Non-malignant Cells",
      countsLabel: "Non-Malignant",
      countsAria: "Normal Cell",
      table: "multiregional_normal_cell",
      statsTable: "multiregional_normal_cell_stats",
      colors: [
        "#4682B4",
        "#FF7F24",
        "#8B4513",
        "#ED82B4",
        "#228B22",
        "#F7EC37",
        "#EE2C2C",
      ],
      axes: { x: "UMAP 1", y: "UMAP 2" },
      initialRange: { x: [-20, 10], y: [-15, 20] },
      legend: {
        title: "Type",
        hint: "Click legend to show/hide types",
        traceOrder: "reverse",
      },
    },
  ],
  tabs: null,
  countsColumns: ["tumor", "normal"],
});

export default function MultiRegionalCohort() {
  return <SingleCellCohortPage state={state} />;
}
