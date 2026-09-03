import PlaceholderPage from "./placeholder-page";

// Spatial Atlas cohort pages. Blank placeholders that reuse the single-cell page
// layout with a per-cohort title; routed from the Spatial Atlas submenu in main-nav.js.

// --- Transcriptomics ---
// Multi-Regional is a real page now — see ../spatial/multi-regional.js.
// TIGER-LC transcriptomics is a real page now — see ../spatial/tiger-lc.js.
export function SpatialTransEuropean() {
  return <PlaceholderPage title="European iCCA" modality="Transcriptomics" />;
}

// --- Proteomics ---
export function SpatialProtTigerLcIcca() {
  return <PlaceholderPage title="TIGER-LC iCCA" modality="Proteomics" />;
}
export function SpatialProtTigerLcHcc() {
  return <PlaceholderPage title="TIGER-LC HCC" modality="Proteomics" />;
}
export function SpatialProtLciHcc() {
  return <PlaceholderPage title="LCI HCC" modality="Proteomics" />;
}
