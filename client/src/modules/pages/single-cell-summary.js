import { Container, Row, Col } from "react-bootstrap";
import CohortWidget from "../components/cohort-widget";

// Single-Cell Atlas Summary page — a landing/summary layer above the existing
// single-cell cohort pages. Overview text + modality sections + cohort widgets.
const scrnaCohorts = [
  {
    title: "NCI-CLARITY",
    to: "/nci-clarity",
    image: "/images/nci_clarity_HD.svg",
    count: "52,789 cells",
    description:
      "52,789 cells from 46 hepatocellular carcinoma (HCC) and intrahepatic cholangiocarcinoma (iCCA) biopsies of 37 patients (GSE151530).",
  },
  {
    title: "Multi-Regional",
    to: "/multi-regional",
    image: "/images/multiregional_HD.svg",
    count: "112,506 cells",
    description:
      "112,506 cells from four HCC and three iCCA patients. Five regions per tumor — three cores (T1–T3), one border (B), and adjacent normal (N); 34 samples (GSE189903).",
  },
  {
    title: "Sequential NCI-CLARITY",
    to: "/sequential",
    image: "/images/sequential_nci_clarity_HD.svg",
    count: "57,567 cells",
    description:
      "57,567 cells from nine HCC and two iCCA patients, sampled longitudinally (two to five each); 31 samples (GSE229772).",
  },
];

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
        <Row className="mt-3">
          {scrnaCohorts.map((cohort) => (
            <Col key={cohort.to} md={4} className="mb-3">
              <CohortWidget {...cohort} />
            </Col>
          ))}
        </Row>
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
