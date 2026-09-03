import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import CohortWidget from "../components/cohort-widget";
import SummarySection from "../components/summary-section";
import Ref from "../components/ref-link";

// Spatial Atlas Summary page — landing/summary layer above the spatial cohort
// pages. Mirrors the Single-Cell summary: overview text + modality sections
// (spatial transcriptomics, spatial proteomics) with cohort widgets under each.
// All copy below is final client wording — render it verbatim.

// widget images per the client's "Images assigned to each widget" map;
// descriptions are the client's exact cohort copy with linked references
const transcriptomicsCohorts = [
  {
    title: "Multi-Regional",
    to: "/spatial/transcriptomics/multi-regional",
    image: "/images/spatial_transcriptomics_multiregional.png",
    description: (
      <>
        This cohort consists of 2,347,589 cells from four HCC patients and three
        iCCA patients. For each tumor, samples from one tumor core (T) and one
        tumor border (B) were profiled. For one patient, an adjacent normal (N)
        tissue sample was also included. In total, 15 samples were included in
        this study
        <br />(
        <Ref href="https://zenodo.org/doi/10.5281/zenodo.13773977">Zenodo</Ref>,
        PMID:{" "}
        <Ref href="https://pubmed.ncbi.nlm.nih.gov/41723121/">41723121</Ref>).
      </>
    ),
  },
  {
    title: "European iCCA",
    to: "/spatial/transcriptomics/european",
    image: "/images/spatial_transcriptomics_european_icca.png",
    description: (
      <>
        This cohort consists of 4,657,511 cells from tumors of 28 patients with
        iCCA. Two tumor samples were collected from a subset of patients,
        resulting in a total of 36 samples across the cohort
        <br />(
        <Ref href="https://doi.org/10.5281/zenodo.18391527">Zenodo</Ref>,{" "}
        <Ref href="https://www.biorxiv.org/content/10.64898/2026.06.02.729644v1">
          BioRxiv
        </Ref>
        ).
      </>
    ),
  },
  {
    title: "TIGER-LC iCCA",
    to: "/spatial/transcriptomics/tiger-lc-icca",
    image: "/images/spatial_transcriptomics_tigerlc_icca.png",
    description: (
      <>
        This cohort consists of 270,906 cells from 131 iCCA patients. Some
        tumors were profiled in duplicate. Overall, 130 samples were retained
        after quality control
        <br />(
        <Ref href="https://doi.org/10.5281/zenodo.18391527">Zenodo</Ref>,{" "}
        <Ref href="https://www.biorxiv.org/content/10.64898/2026.06.02.729644v1">
          BioRxiv
        </Ref>
        ).
      </>
    ),
  },
];

const proteomicsCohorts = [
  {
    title: "LCI HCC",
    to: "/spatial/proteomics/lci-hcc",
    image: "/images/spatial_proteomics_lci_hcc.png",
    description: (
      <>
        This cohort consists of 465,632 cells from 190 HCC patients
        <br />(
        <Ref href="https://github.com/MaLab621/CODEX_HCC">MaLab621</Ref>, PMID:{" "}
        <Ref href="https://pubmed.ncbi.nlm.nih.gov/37725716/">37725716</Ref>).
      </>
    ),
  },
  {
    title: "TIGER-LC HCC",
    to: "/spatial/proteomics/tiger-lc-hcc",
    image: "/images/spatial_proteomics_tigerlc_hcc.png",
    description: (
      <>
        This cohort consists of 117,270 cells from 68 HCC patients. For most
        patients, one tumor sample and one adjacent normal tissue sample were
        included, resulting in a total of 116 samples in this study
        <br />(
        <Ref href="https://github.com/MaLab621/CODEX_HCC">MaLab621</Ref>, PMID:{" "}
        <Ref href="https://pubmed.ncbi.nlm.nih.gov/37725716/">37725716</Ref>).
      </>
    ),
  },
  {
    // client copy titles this description "TIGER-LC iCCA (tumor and non-tumor)"
    title: "TIGER-LC iCCA",
    to: "/spatial/proteomics/tiger-lc-icca",
    image: "/images/spatial_proteomics_tigerlc_icca.png",
    description: (
      <>
        This cohort consists of 1,121,604 cells from 131 iCCA patients. For each
        patient, one tumor sample and one adjacent normal tissue sample were
        included. In total, 262 samples were collected across all patients
        <br />(
        <Ref href="https://zenodo.org/records/15419271">Zenodo</Ref>,{" "}
        <Ref href="https://www.biorxiv.org/content/10.64898/2026.06.02.729644v1">
          BioRxiv
        </Ref>
        ).
      </>
    ),
  },
];

function CohortRow({ cohorts }) {
  return (
    <Row className="mt-3">
      {cohorts.map((cohort) => (
        <Col key={cohort.to} md={4} className="mb-3">
          <CohortWidget
            title={cohort.title}
            to={cohort.to}
            image={cohort.image}
            description={cohort.description}
          />
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

      <p>
        The Spatial Atlas of Liver Cancer comprises spatial transcriptomic and
        proteomic profiles of tumor cell communities in HCC and iCCA at
        single-cell spatial resolution. It can be used to evaluate gene and
        protein expression within their spatial context across tumor cells,
        stromal cells and immune cells.
      </p>
      <p>
        Whole-tissue sections were used for profiling in the Multi-Regional and
        European iCCA cohorts, whereas tissue microarrays were used in the other
        cohorts. Spatial transcriptomic profiling was performed using CosMx, and
        spatial proteomic profiling was performed using CODEX. Both platforms
        provide single-cell spatial resolution.
      </p>

      <SummarySection
        icon="bi-grid-1x2-fill"
        title="Single-cell spatial transcriptomics"
        active={activeSection === "transcriptomics"}
        onActivate={() => setActiveSection("transcriptomics")}>
        <CohortRow cohorts={transcriptomicsCohorts} />
      </SummarySection>

      <SummarySection
        icon="bi-palette-fill"
        title="Single-cell spatial proteomics"
        active={activeSection === "proteomics"}
        onActivate={() => setActiveSection("proteomics")}>
        <CohortRow cohorts={proteomicsCohorts} />
      </SummarySection>
    </Container>
  );
}
