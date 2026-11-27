import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import CohortWidget from "../components/cohort-widget";
import SummarySection from "../components/summary-section";
import Ref from "../components/ref-link";

// Single-Cell Atlas Summary page — a landing/summary layer above the existing
// single-cell cohort pages. Overview text + modality sections + cohort widgets.
// Descriptions are the client's exact cohort copy with linked GSE/PMID references.
const scrnaCohorts = [
  {
    title: "NCI-CLARITY",
    to: "/nci-clarity",
    image: "/images/nci_clarity_HD.svg",
    count: "52,789 cells",
    description: (
      <>
        This cohort includes single cell transcriptomic profiles of 52,789
        cells derived from 46 HCC and iCCA biopsies of 37 patients.
        <br />
        Data:{" "}
        <Ref href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE125449">
          GSE125449
        </Ref>
        ,{" "}
        <Ref href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE151530">
          GSE151530
        </Ref>
        ; PMIDs:{" "}
        <Ref href="https://pubmed.ncbi.nlm.nih.gov/31588021/">31588021</Ref>,{" "}
        <Ref href="https://pubmed.ncbi.nlm.nih.gov/34216724/">34216724</Ref>
      </>
    ),
  },
  {
    title: "Multi-Regional",
    to: "/multi-regional",
    image: "/images/multiregional_HD.svg",
    count: "112,506 cells",
    description: (
      <>
        This cohort consists of 112,506 cells from four HCC patients and three
        iCCA patients. For each tumor, single cells were obtained from five
        separate regions, i.e., three tumor cores (T1, T2, and T3), one tumor
        border (B) and an adjacent normal tissue (N). A total of 34 samples
        were included in this study.
        <br />
        Data:{" "}
        <Ref href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE189903">
          GSE189903
        </Ref>
        ; PMID:{" "}
        <Ref href="https://pubmed.ncbi.nlm.nih.gov/36476645/">36476645</Ref>
      </>
    ),
  },
  {
    title: "Sequential NCI-CLARITY",
    to: "/sequential",
    image: "/images/sequential_nci_clarity_HD.svg",
    count: "57,567 cells",
    description: (
      <>
        This cohort consists of 57,567 cells from nine HCC patients and two
        iCCA patients. Tumor biopsies were collected longitudinally, with two
        to five samples for each patient. Overall, 31 samples were collected
        across all patients.
        <br />
        Data:{" "}
        <Ref href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE229772">
          GSE229772
        </Ref>
        ; PMID:{" "}
        <Ref href="https://pubmed.ncbi.nlm.nih.gov/38280378/">38280378</Ref>
      </>
    ),
  },
];

export default function SingleCellSummary() {
  // which section's icon is currently highlighted (latched; one at a time)
  const [activeSection, setActiveSection] = useState(null);

  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">Single-Cell Atlas</h1>
      <hr />

      <p>
        The Single-cell Atlas of Liver Cancer comprises single-cell
        transcriptomic profiles of tumor cell communities in HCC and iCCA.
      </p>
      <p>
        It can be used to evaluate gene expression in malignant cells and
        various non-malignant cells. It can be further used to determine gene
        expression in different subtypes of stromal cells and immune cells.
      </p>

      <SummarySection
        icon="bi-diagram-3-fill"
        title="Single-cell RNA sequencing (scRNA-seq)"
        active={activeSection === "scrna"}
        onActivate={() => setActiveSection("scrna")}>
        <Row className="mt-3">
          {scrnaCohorts.map((cohort) => (
            <Col key={cohort.to} md={4} className="mb-3">
              <CohortWidget {...cohort} />
            </Col>
          ))}
        </Row>
      </SummarySection>
    </Container>
  );
}
