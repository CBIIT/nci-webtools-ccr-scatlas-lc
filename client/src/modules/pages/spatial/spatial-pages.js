import SpatialCohortPage from "./spatial-cohort-page";

// Spatial Atlas cohort pages. Blank placeholders that reuse the single-cell page
// layout with a per-cohort title; routed from the Spatial Atlas submenu in main-nav.js.

// --- Transcriptomics ---
export function SpatialTransMultiRegional() {
  return <SpatialCohortPage title="Multi-Regional" modality="Transcriptomics" />;
}
export function SpatialTransEuropean() {
  return <SpatialCohortPage title="European" modality="Transcriptomics" />;
}
// TIGER-LC transcriptomics is a real page now — see ../spatial/tiger-lc.js.

// --- Proteomics ---
export function SpatialProtTigerLcIcca() {
  return <SpatialCohortPage title="TIGER-LC ICCA" modality="Proteomics" />;
}
export function SpatialProtTigerLcHcc() {
  return <SpatialCohortPage title="TIGER-LC HCC" modality="Proteomics" />;
}
export function SpatialProtLciHcc() {
  return <SpatialCohortPage title="LCI HCC" modality="Proteomics" />;
}
