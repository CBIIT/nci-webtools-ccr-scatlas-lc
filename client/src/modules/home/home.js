import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";

// Home page — a high-level portal: a full-bleed background image with a centered
// intro (title + description), the Explore buttons, and the Total Counts tiles.
// The buttons are data-driven so more can be added without restructuring the page.
const TITLE = "Single-Cell and Spatial Multi-Omics Atlas of Liver Cancer";
const DESCRIPTION =
  "SpatialAtlasLC is a publicly available multi-omics data portal to construct " +
  "single-cell and spatial atlases of the transcriptomic, proteomic, and epigenomic " +
  "features of tumor cell communities in primary liver cancers and cancers metastasized " +
  "to the liver, with future expansion into 3D and 4D spatial profiling modalities.";

// Atlas entry points — add an entry here to surface another "Explore" button.
const EXPLORE_LINKS = [
  { label: "Explore Single-Cell Atlas", to: "/single-cell" },
  { label: "Explore Spatial Atlas", to: "/spatial" },
];

// Total Counts — values are placeholders ("XYZ", per the client mockup) until the
// counts data source is provided; swap in real numbers when available.
const TOTAL_COUNTS = [
  { label: "Data Types", value: "XYZ" },
  { label: "Cohorts", value: "XYZ" },
  { label: "Cases", value: "XYZ" },
  { label: "Biospecimen", value: "XYZ" },
];

export default function Home() {
  return (
    // Background image is the client-provided spatial-tissue micrograph; set inline
    // from the public folder (CRA serves /images/* at the root) over a dark fallback.
    <div
      className="home-hero"
      style={{
        backgroundImage: "url(/images/home-hero-spatial-tissue.png)",
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
