import { Container, Row, Col } from "react-bootstrap";
import CohortWidget from "../components/cohort-widget";

// Spatial Atlas Summary page — landing/summary layer above the spatial cohort
// pages. Mirrors the Single-Cell summary: overview text + modality sections
// (spatial transcriptomics, spatial proteomics) with cohort widgets under each.
// Overview text and per-cohort descriptions are pending from the client, so they
// show placeholder (lorem ipsum) copy; images use a placeholder until provided.
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, " +
  "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.";

const transcriptomicsCohorts = [
  { title: "Multi-Regional", to: "/spatial/transcriptomics/multi-regional" },
  { title: "European", to: "/spatial/transcriptomics/european" },
  { title: "TIGER-LC", to: "/spatial/transcriptomics/tiger-lc" },
];

const proteomicsCohorts = [
  { title: "TIGER-LC ICCA", to: "/spatial/proteomics/tiger-lc-icca" },
  { title: "TIGER-LC HCC", to: "/spatial/proteomics/tiger-lc-hcc" },
  { title: "LCI HCC", to: "/spatial/proteomics/lci-hcc" },
];

function CohortRow({ cohorts }) {
  return (
    <Row className="mt-3">
      {cohorts.map((cohort) => (
        <Col key={cohort.to} md={4} className="mb-3">
          <CohortWidget title={cohort.title} to={cohort.to} description={LOREM} />
        </Col>
      ))}
    </Row>
  );
}

export default function SpatialSummary() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">Spatial Atlas</h1>
      <hr />

      <p className="text-muted fst-italic">{LOREM}</p>

      <section className="summary-section mt-4">
        <div className="summary-section-head" tabIndex={0}>
          <i className="bi bi-grid-1x2-fill summary-icon" aria-hidden="true" />
          <h2 className="h5 mb-0">Spatial transcriptomics</h2>
        </div>
        <CohortRow cohorts={transcriptomicsCohorts} />
      </section>

      <section className="summary-section mt-4">
        <div className="summary-section-head" tabIndex={0}>
          <i className="bi bi-palette-fill summary-icon" aria-hidden="true" />
          <h2 className="h5 mb-0">Spatial proteomics</h2>
        </div>
        <CohortRow cohorts={proteomicsCohorts} />
      </section>
    </Container>
  );
}
