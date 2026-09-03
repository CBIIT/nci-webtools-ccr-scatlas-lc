import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";

// Home page — a high-level portal: a full-bleed background image with a centered
// intro (title + description), the Explore buttons, and the Total Counts tiles.
// The buttons are data-driven so more can be added without restructuring the page.
const TITLE = "Spatial and Single-Cell Atlas of Liver Cancer";
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

// Total Counts — client-provided static values, in the client's display order;
// becomes a query if a dynamic counts source is ever defined.
const TOTAL_COUNTS = [
  { label: "Cases", value: "463" },
  { label: "Biospecimens", value: "847" },
  { label: "Cells", value: "9.2M" },
  { label: "Cohorts", value: "7" },
];

export default function Home() {
  return (
    // Background is a 2560px web derivative of the client's Homepage_figure.jpg
    // (original is 18000px/15MB — too heavy to ship; full-res source lives with the
    // ticket docs); set inline from the public folder (CRA serves /images/* at the
    // root) over a dark fallback.
    <div
      className="home-hero"
      style={{
        backgroundImage: "url(/images/homepage_figure.jpg)",
      }}>
      <Container className="pt-5 d-flex flex-column align-items-center align-self-stretch">
        <div className="home-intro text-center rounded shadow p-4 p-md-5">
          <h1 className="h3 text-primary mb-3">{TITLE}</h1>
          <p className="mb-0">{DESCRIPTION}</p>
        </div>
        {/* buttons straddle the intro card's bottom edge (half on card, half on hero) */}
        <div className="home-explore gap-3">
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
        {/* mb-4 keeps a floor under the counts→credit gap once the viewport is
            short enough that the credit card's auto margin collapses to zero */}
        <Row className="home-counts w-100 justify-content-center g-3 mb-4">
          {TOTAL_COUNTS.map((count) => (
            <Col key={count.label} xs={6} md={3}>
              <div className="home-count-tile text-center rounded shadow-sm py-3 px-2 h-100">
                <div className="h2 mb-1 text-primary">{count.value}</div>
                <div className="small text-uppercase">
                  {count.label}
                </div>
              </div>
            </Col>
          ))}
        </Row>
        {/* credit + disclaimer at the page bottom — moved here from the site
            footer's References section, which NCIATWP-11120 removes; the Home
            page is the only place these display */}
        {/* mt-auto pins it near the hero's bottom edge; mb-4 floats it a bit up */}
        <div className="home-credit text-center rounded shadow-sm mt-auto mb-4 p-3">
          <p className="mb-2">
            The scAtlasLC was developed by the MA Lab at the{" "}
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
            , Center for Cancer Research, National Cancer Institute.
          </p>
          <p className="h6 mb-1">Disclaimer</p>
          <p className="mb-0 small">
            Each dataset was normalized independently. Gene expression levels
            may not be comparable between datasets.
          </p>
        </div>
      </Container>
    </div>
  );
}
