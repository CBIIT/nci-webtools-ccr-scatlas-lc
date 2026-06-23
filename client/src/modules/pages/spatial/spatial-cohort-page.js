import { Container } from "react-bootstrap";

// Blank Spatial Atlas cohort page — mirrors the single-cell page layout
// (Container → h1 title → hr → body). The interactive spatial plots are built in
// future tickets (NCIATWP-10326 Multi-Regional, NCIATWP-10327 TIGER-LC); for now
// each cohort renders this placeholder so the menu has real targets.
export default function SpatialCohortPage({ title, modality }) {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">{title}</h1>
      <hr />
      <p className="text-muted">
        {modality ? `Spatial Atlas — ${modality}. ` : ""}
        This cohort page is coming soon.
      </p>
    </Container>
  );
}
