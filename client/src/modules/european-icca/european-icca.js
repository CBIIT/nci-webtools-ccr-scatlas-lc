import { createSpatialCohortState } from "../spatial-cohort/spatial-cohort-state";
import SpatialCohortPage from "../spatial-cohort/spatial-cohort-page";

// Spatial European iCCA (CosMx) cohort — a configuration of the shared
// spatial-cohort template. The atlas's largest cohort: 4.66M cells over 36
// samples (~110k mean, up to ~467k each), beyond Multi-Regional's scale, so it
// takes the same treatment — per-sample fetching with WebGL rendering and the
// mount window + live-row ceiling that keep the page inside the browser's
// ~16-WebGL-context cap (see spatial-multi-regional.js for the reasoning
// behind the margin/ceiling pairing).
const state = createSpatialCohortState({
  id: "europeanIcca",
  title: "European iCCA",
  tables: {
    cells: "european_icca",
    stats: "european_icca_stats",
    statsTable: "european_icca_stats_table",
  },
  cellTypeColors: {
    Epithelial: "#3A5FCD",
    Immune: "#FF8C00",
    Malignant: "#EE2C2C",
    Stromal: "#32CD32",
    unclassified: "#A9A9A9",
  },
  // display order of the statistics table's value columns — follows the
  // client's stats_table_germany.csv column order
  statsTableTypes: [
    "Immune",
    "Stromal",
    "Malignant",
    "Epithelial",
    "unclassified",
  ],
  defaultGene: "EPCAM",
  fetch: "perSample",
  // the client's sample factor levels, in their delivered order; the six empty
  // levels (c74-*, c76-*, c78-*: zero cells in the drop) are left out
  // prettier-ignore
  samples: [
    "c1", "c2", "c3-1", "c3-2", "c5", "c6-2", "c6-1", "c8-1", "c8-2", "c10-1",
    "c10-2", "c11", "c15", "c31", "c34-1", "c34-2", "c37", "c38", "c41", "c47",
    "c49", "c50-2", "c50-1", "c51", "c52", "c59", "c60-1", "c60-2", "c63-1",
    "c63-2", "c65", "c68", "c70", "c71", "c72", "c77",
  ],
  renderer: "scattergl",
  mountMargin: "200px",
  unmountMargin: "600px",
  maxLiveRows: 6,
  sampleCacheSize: 6,
});

export default function EuropeanIcca() {
  return <SpatialCohortPage state={state} />;
}
