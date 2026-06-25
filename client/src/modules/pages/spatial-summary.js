import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import CohortWidget from "../components/cohort-widget";
import SummarySection from "../components/summary-section";

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
  // which section's icon is currently highlighted (latched; one at a time)
  const [activeSection, setActiveSection] = useState(null);

  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">Spatial Atlas</h1>
      <hr />

      <p className="text-muted fst-italic">{LOREM}</p>

      <SummarySection
        icon="bi-grid-1x2-fill"
        title="Spatial transcriptomics"
        active={activeSection === "transcriptomics"}
        onActivate={() => setActiveSection("transcriptomics")}>
        <CohortRow cohorts={transcriptomicsCohorts} />
      </SummarySection>

      <SummarySection
        icon="bi-palette-fill"
        title="Spatial proteomics"
        active={activeSection === "proteomics"}
        onActivate={() => setActiveSection("proteomics")}>
        <CohortRow cohorts={proteomicsCohorts} />
      </SummarySection>
    </Container>
  );
}
