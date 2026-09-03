import { Container } from "react-bootstrap";

// Blank Spatial Atlas cohort page — mirrors the single-cell page layout
// (Container → h1 title → hr → body). Cohorts render this placeholder until
// their real page is built on the spatial-cohort template; each then gets its
// own wrapper here (see tiger-lc.js, multi-regional.js) so the menu always has
// real targets.
export default function PlaceholderPage({ title, modality }) {
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
