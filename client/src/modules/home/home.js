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
  "includes single-cell transcriptomic, spatial transcriptomic, and spatial proteomic " +
  "data from hepatocellular carcinoma (HCC) and intrahepatic cholangiocarcinoma (iCCA), " +
  "the two major subtypes of primary liver cancer.";

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
      <Container className="py-5 d-flex flex-column align-items-center">
        <div className="home-intro text-center rounded shadow p-4 p-md-5">
          <h1 className="h3 text-primary mb-3">{TITLE}</h1>
          <p className="mb-0">{DESCRIPTION}</p>
        </div>
        {/* buttons straddle the intro card's bottom edge (half on card, half on hero) */}
        <div className="home-explore d-flex flex-wrap justify-content-center gap-3">
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
        <Row className="home-counts w-100 justify-content-center g-3">
          {TOTAL_COUNTS.map((count) => (
            <Col key={count.label} xs={6} md={3}>
              <div className="home-count-tile text-center rounded shadow-sm py-3 px-2 h-100">
                <div className="h2 mb-1 text-primary">{count.value}</div>
                <div className="text-muted small text-uppercase">
                  {count.label}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}
