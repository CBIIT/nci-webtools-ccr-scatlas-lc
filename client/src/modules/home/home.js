import Container from "react-bootstrap/Container";

// Home page — a high-level portal: a full-bleed background image with a centered
// intro (title + description). The Explore buttons and the Total Counts tiles mount
// below the intro in later steps, so components can be added without restructuring.
const TITLE = "Single-Cell and Spatial Multi-Omics Atlas of Liver Cancer";
const DESCRIPTION =
  "SpatialAtlasLC is a publicly available multi-omics data portal to construct " +
  "single-cell and spatial atlases of the transcriptomic, proteomic, and epigenomic " +
  "features of tumor cell communities in primary liver cancers and cancers metastasized " +
  "to the liver, with future expansion into 3D and 4D spatial profiling modalities.";

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
        <div className="home-intro text-center bg-white bg-opacity-75 rounded shadow p-4 p-md-5">
          <h1 className="h3 text-primary mb-3">{TITLE}</h1>
          <p className="mb-0">{DESCRIPTION}</p>
        </div>
        {/* Explore buttons and Total Counts tiles mount here, below the intro. */}
      </Container>
    </div>
  );
}
