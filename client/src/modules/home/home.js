import { useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";

// Home page — a high-level portal in two bands: a navy hero (title + description
// on the left, the tissue image on the right fading into the navy, a curved
// bottom edge), then a white section with the Total Counts, the Explore buttons,
// and the credit + disclaimer. The buttons and counts are data-driven so more
// can be added without restructuring the page.
const TITLE = "Spatial and Single-Cell Atlas of Liver Cancer (scAtlasLC)";
const DESCRIPTION =
  "The scAtlasLC is a publicly available multi-omics data portal for characterizing " +
  "cellular communities in liver cancer at single-cell and spatial resolution. It " +
  "includes single-cell transcriptomics, spatial transcriptomics, and spatial " +
  "proteomics data from hepatocellular carcinoma (HCC) and intrahepatic " +
  "cholangiocarcinoma (iCCA), the two major subtypes of primary liver cancer.";

// Atlas entry points — add an entry here to surface another "Explore" button.
const EXPLORE_LINKS = [
  { label: "Explore Single-Cell Atlas", to: "/single-cell" },
  { label: "Explore Spatial Atlas", to: "/spatial" },
];

// Hero image: a 3840px web derivative of the client's newer 21000px figure, with
// an unsharp mask (that figure holds only ~2000px of real detail, so a larger copy
// alone adds little sharpness); progressive JPEG, quality 82, metadata stripped.
// Full-resolution sources live with the ticket docs. Served from the public
// folder (CRA serves /images/* at the root).
const HERO_IMAGE = "/images/homepage_figure.jpg";

// Total Counts — client-provided static values, in the client's display order;
// becomes a query if a dynamic counts source is ever defined.
const TOTAL_COUNTS = [
  { label: "Cases", value: "463" },
  { label: "Biospecimens", value: "847" },
  { label: "Cells", value: "9.2M" },
  { label: "Cohorts", value: "7" },
];

export default function Home() {
  // The hero continues the navbar's navy, so while the home page is shown the navbar
  // blends into it (see .route-home in main.scss).
  useEffect(() => {
    document.body.classList.add("route-home");
    return () => document.body.classList.remove("route-home");
  }, []);

  return (
    <div className="home">
      <section className="home-hero">
        {/* a mask fades the image's left edge into the navy */}
        <div
          className="home-hero-image"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          aria-hidden="true"
        />
        <Container className="home-hero-content">
          <h1 className="home-title">{TITLE}</h1>
          <p className="home-description mb-0">{DESCRIPTION}</p>
        </Container>
        {/* curved bottom edge: the white section rises into the hero */}
        <svg
          className="home-hero-curve"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden="true">
          <path
            className="home-hero-curve-rim"
            d="M0,34 C420,-6 940,0 1440,86 L1440,100 L0,100 Z"
          />
          <path
            className="home-hero-curve-fill"
            d="M0,44 C420,6 940,12 1440,96 L1440,100 L0,100 Z"
          />
        </svg>
      </section>

      <section className="home-body">
        <Container className="text-center">
          <Row className="home-counts justify-content-center g-3">
            {TOTAL_COUNTS.map((count) => (
              <Col key={count.label} xs={6} md={3}>
                <div className="home-count-value">{count.value}</div>
                <div className="home-count-label">{count.label}</div>
              </Col>
            ))}
          </Row>

          <div className="home-explore">
            {EXPLORE_LINKS.map((link) => (
              <Button
                key={link.to}
                as={Link}
                to={link.to}
                variant="primary"
                size="lg">
                {link.label}
              </Button>
            ))}
          </div>

          {/* credit + disclaimer — moved here from the site footer's References
              section; the Home page is the only place these display */}
          <div className="home-credit">
            <p className="mb-3">
              The scAtlasLC was developed by the{" "}
              <a
                href="https://ccr.cancer.gov/staff-directory/lichun-ma"
                target="_blank"
                rel="noopener noreferrer">
                MA Lab
              </a>{" "}
              at the{" "}
              <a
                href="https://ccr.cancer.gov/cancer-data-science-laboratory"
                target="_blank"
                rel="noopener noreferrer">
                Cancer Data Science Laboratory
              </a>{" "}
              and the{" "}
              <a
                href="https://ccr.cancer.gov/liver-cancer-program"
                target="_blank"
                rel="noopener noreferrer">
                Liver Cancer Program
              </a>
              , Center for Cancer Research, National Cancer Institute, in
              collaboration with the NCI's Center for Biomedical Informatics &amp;
              Information Technology (CBIIT).
            </p>
            <h2 className="h5 mb-1">Disclaimer</h2>
            <p className="mb-0">
              scAtlasLC data and results are provided for research use only.
              Datasets were normalized independently; gene expression levels may
              not be directly comparable across datasets. All data and resources
              are provided “as is.” Users are responsible for validating findings.
              Use of the portal and its contents is at the user’s own risk. Please
              acknowledge scAtlasLC as the source when using figures downloaded
              from or generated through the portal.
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
