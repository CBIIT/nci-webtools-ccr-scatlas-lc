import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";

// Spatial TIGER-LC iCCA proteomics (CODEX) cohort — a configuration of the
// shared spatial-cohort template. 1.09M cells over 229 samples (~4.8k each,
// max ~13k): too large to download whole (a gene change would re-join a
// million-row array), so rows fetch per sample like Multi-Regional — but each
// sample is small enough for SVG scatter, which dodges the browser's
// WebGL-context cap without needing a maxLiveRows ceiling. Values are raw
// CODEX fluorescence intensities and coordinates are slide pixels, hence
// units "px".
const state = createSpatialCohortState({
  id: "codexTigerLcIcca",
  title: "TIGER-LC iCCA",
  tables: {
    cells: "codex_tigerlc_icca",
    stats: "codex_tigerlc_icca_stats",
    statsTable: "codex_tigerlc_icca_stats_table",
  },
  // shared palette across cohorts where types recur (Epithelial blue,
  // Endothelial orange, Fibroblast green); Malignant keeps TIGER-LC's red, so
  // Myeloid takes purple; Unknown is gray
  cellTypeColors: {
    Endothelial: "#FF8C00",
    Epithelial: "#3A5FCD",
    Fibroblast: "#32CD32",
    Lymphocyte: "#17BECF",
    Malignant: "#EE2C2C",
    Myeloid: "#9467BD",
    "Other Immune cells": "#8C564B",
    Unknown: "#A9A9A9",
  },
  // display order of the statistics table's value columns — follows the
  // client's stats_table_tigerlc.csv column order
  statsTableTypes: [
    "Lymphocyte",
    "Unknown",
    "Endothelial",
    "Other Immune cells",
    "Myeloid",
    "Fibroblast",
    "Malignant",
    "Epithelial",
  ],
  defaultGene: "EPCAM",
  fetch: "perSample",
  // prettier-ignore
  samples: [
    "LCS-569 N", "LCS-569 T", "LCS-570 N", "LCS-570 T", "LCS-571 N",
    "LCS-571 T", "LCS-572 N", "LCS-572 T", "LCS-573 N", "LCS-573 T",
    "LCS-574 N", "LCS-574 T", "LCS-575 N", "LCS-575 T", "LCS-576 N",
    "LCS-576 T", "LCS-577 N", "LCS-577 T", "LCS-578 N", "LCS-578 T",
    "LCS-579 N", "LCS-579 T", "LCS-580 N", "LCS-580 T", "LCS-581 N",
    "LCS-581 T", "LCS-582 N", "LCS-582 T", "LCS-583 N", "LCS-583 T",
    "LCS-584 N", "LCS-584 T", "LCS-585 N", "LCS-585 T", "LCS-586 N",
    "LCS-586 T", "LCS-587 N", "LCS-587 T", "LCS-588 N", "LCS-588 T",
    "LCS-589 N", "LCS-589 T", "LCS-590 N", "LCS-590 T", "LCS-591 N",
    "LCS-591 T", "LCS-592 N", "LCS-592 T", "LCS-593 N", "LCS-593 T",
    "LCS-596 N", "LCS-596 T", "LCS-597 N", "LCS-597 T", "LCS-598 N",
    "LCS-598 T", "LCS-599 N", "LCS-599 T", "LCS-600 N", "LCS-600 T",
    "LCS-601 N", "LCS-601 T", "LCS-602 N", "LCS-602 T", "LCS-603 N",
    "LCS-603 T", "LCS-604 N", "LCS-604 T", "LCS-605 N", "LCS-605 T",
    "LCS-606 N", "LCS-606 T", "LCS-607 N", "LCS-607 T", "LCS-608 N",
    "LCS-608 T", "LCS-609 N", "LCS-609 T", "LCS-610 N", "LCS-610 T",
    "LCS-611 N", "LCS-611 T", "LCS-612 N", "LCS-612 T", "LCS-613 N",
    "LCS-613 T", "LCS-614 N", "LCS-615 N", "LCS-616 N", "LCS-617 N",
    "LCS-618 N", "LCS-619 N", "LCS-619 T", "LCS-620 N", "LCS-620 T",
    "LCS-621 N", "LCS-621 T", "LCS-622 N", "LCS-622 T", "LCS-623 N",
    "LCS-623 T", "LCS-624 N", "LCS-624 T", "LCS-625 N", "LCS-625 T",
    "LCS-626 N", "LCS-626 T", "LCS-627 N", "LCS-627 T", "LCS-628 N",
    "LCS-628 T", "LCS-629 N", "LCS-629 T", "LCS-630 N", "LCS-630 T",
    "LCS-631 N", "LCS-631 T", "LCS-632 N", "LCS-633 N", "LCS-633 T",
    "LCS-634 N", "LCS-634 T", "LCS-635 N", "LCS-635 T", "LCS-636 N",
    "LCS-636 T", "LCS-637 N", "LCS-637 T", "LCS-638 N", "LCS-638 T",
    "LCS-639 N", "LCS-639 T", "LCS-640 N", "LCS-640 T", "LCS-641 N",
    "LCS-641 T", "LCS-642 N", "LCS-642 T", "LCS-643 N", "LCS-643 T",
    "LCS-644 N", "LCS-644 T", "LCS-645 N", "LCS-645 T", "LCS-646 N",
    "LCS-646 T", "LCS-647 N", "LCS-647 T", "LCS-648 N", "LCS-648 T",
    "LCS-649 N", "LCS-649 T", "LCS-650 N", "LCS-650 T", "LCS-651 N",
    "LCS-651 T", "LCS-652 N", "LCS-652 T", "LCS-653 N", "LCS-653 T",
    "LCS-654 N", "LCS-654 T", "LCS-655 N", "LCS-655 T", "LCS-656 N",
    "LCS-656 T", "LCS-657 N", "LCS-657 T", "LCS-658 N", "LCS-658 T",
    "LCS-659 T", "LCS-660 T", "LCS-661 T", "LCS-662 T", "LCS-663 T",
    "LCS-664 N", "LCS-665 N", "LCS-666 N", "LCS-667 N", "LCS-668 N",
    "LCS-669 N", "LCS-669 T", "LCS-670 N", "LCS-670 T", "LCS-671 N",
    "LCS-671 T", "LCS-672 N", "LCS-672 T", "LCS-673 N", "LCS-673 T",
    "LCS-674 N", "LCS-674 T", "LCS-675 N", "LCS-675 T", "LCS-676 N",
    "LCS-676 T", "LCS-677 N", "LCS-677 T", "LCS-678 N", "LCS-678 T",
    "LCS-679 N", "LCS-679 T", "LCS-680 N", "LCS-680 T", "LCS-681 N",
    "LCS-681 T", "LCS-682 N", "LCS-682 T", "LCS-683 N", "LCS-683 T",
    "LCS-684 N", "LCS-684 T", "LCS-685 N", "LCS-685 T", "LCS-686 N",
    "LCS-686 T", "LCS-687 N", "LCS-687 T", "LCS-688 N", "LCS-688 T",
    "LCS-689 N", "LCS-689 T", "LCS-690 T", "LCS-691 T", "LCS-692 T",
    "LCS-693 T", "LCS-694 T", "LCS-695 T", "LCS-696 T",
  ],
  renderer: "scatter",
  units: "px",
});

export default function CodexTigerLcIcca() {
  return <SpatialCohortPage state={state} />;
}
