import { Container } from "react-bootstrap";

// Single-Cell Atlas Summary page — a landing/summary layer above the existing
// single-cell cohort pages. Overview text + modality sections; the cohort widgets
// under scRNA-seq are wired next (the CohortWidget shared component).
export default function SingleCellSummary() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">Single-Cell Atlas</h1>
      <hr />

      <p>
        Single-cell Atlas in Liver Cancer is a publicly available data portal of
        single-cell transcriptomic profiles of tumor cell communities in
        hepatocellular carcinoma and intrahepatic cholangiocarcinoma.
      </p>
      <p>
        It can be used to evaluate gene expression in malignant cells and
        various non-malignant cells in liver cancer. It can be further used to
        determine gene expression in different subtypes of stromal cells and
        immune cells.
      </p>

      <section className="summary-section mt-4">
        <div className="summary-section-head" tabIndex={0}>
          <i className="bi bi-diagram-3-fill summary-icon" aria-hidden="true" />
          <h2 className="h5 mb-0">Single cell RNA sequencing (scRNA-seq)</h2>
        </div>
        {/* cohort widgets wired in the next sub-problem */}
        <p className="text-muted mt-3">Cohort widgets coming next.</p>
      </section>

      <section className="summary-section mt-4">
        <div className="summary-section-head" tabIndex={0}>
          <i className="bi bi-grid-3x3-gap-fill summary-icon" aria-hidden="true" />
          <h2 className="h5 mb-0">
            Single-cell spatial transcriptomics (CosMx SMI)
          </h2>
        </div>
        <p className="text-muted mt-3">Coming soon.</p>
      </section>
    </Container>
  );
}
