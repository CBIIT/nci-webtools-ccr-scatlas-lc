import { Container } from "react-bootstrap";

// Spatial Atlas Summary page — landing/summary layer above the spatial cohort
// pages. Mirrors the Single-Cell summary: overview text + modality sections
// (spatial transcriptomics, spatial proteomics) with cohort widgets under each.
// Overview text and per-cohort descriptions are pending from the client.
export default function SpatialSummary() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">Spatial Atlas</h1>
      <hr />

      <p className="text-muted fst-italic">Overview text coming soon.</p>

      <section className="summary-section mt-4">
        <div className="summary-section-head" tabIndex={0}>
          <i className="bi bi-grid-1x2-fill summary-icon" aria-hidden="true" />
          <h2 className="h5 mb-0">Spatial transcriptomics</h2>
        </div>
        {/* cohort widgets wired in the next sub-problem */}
        <p className="text-muted mt-3">Cohort widgets coming next.</p>
      </section>

      <section className="summary-section mt-4">
        <div className="summary-section-head" tabIndex={0}>
          <i className="bi bi-palette-fill summary-icon" aria-hidden="true" />
          <h2 className="h5 mb-0">Spatial proteomics</h2>
        </div>
        {/* cohort widgets wired in the next sub-problem */}
        <p className="text-muted mt-3">Cohort widgets coming next.</p>
      </section>
    </Container>
  );
}
