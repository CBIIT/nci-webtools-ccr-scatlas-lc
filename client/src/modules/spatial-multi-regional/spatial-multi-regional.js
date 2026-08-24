import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";

// Spatial Multi-Regional (CosMx) cohort — a configuration of the shared
// spatial-cohort template. At 2.35M cells over 15 samples (~20k–330k cells
// each) the cohort is far too large to download whole, so it uses per-sample
// fetching (each row loads on scroll via the query API's sample filter, with a
// per-row expression color scale) and WebGL rendering — SVG scatter cannot hold
// 100k+ points per plot.
//
// The mount window is sized against the browser's WebGL context cap (~16 per
// page in Chrome; exceeding it silently evicts the oldest contexts and blanks
// those plots). A row is ~412px tall at xl and up and holds 2 contexts, and
// stays mounted while within unmountMargin of the viewport, so the live band
// is viewport + 2 x unmountMargin: at 600px that is ~6 rows / 12 contexts on a
// 900px viewport and ~7 rows / 14 on a 1400px one. A viewport tall enough to
// hold more rows than that still approaches the cap — worth re-checking
// empirically on the widest supported display.
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
  // The hysteresis band (unmountMargin - mountMargin) must exceed the height a
  // row GAINS when it mounts, or the two thresholds oscillate: below the xl
  // breakpoint the pair of plots stacks, so a mounted row is ~736px against a
  // 396px placeholder — a 340px jump that would push the row back inside
  // mountMargin the moment it unmounted.
  mountMargin: "200px",
  unmountMargin: "600px",
  // Samples retained by the state module's caches (cells and expression each
  // keep this many), for cheap scroll-back. Sized under the cohort's 15
  // samples on purpose: holding most of them would reconstitute the
  // whole-table footprint this fetch mode avoids. Entries for mounted rows are
  // the same arrays those rows already hold, so only the recently-departed
  // rows cost anything.
  sampleCacheSize: 6,
});

export default function SpatialMultiRegional() {
  return <SpatialCohortPage state={state} />;
}
