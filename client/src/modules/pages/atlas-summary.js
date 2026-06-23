import { Container } from "react-bootstrap";

// Placeholder Atlas Summary page. The full summary (overview text, modality icons,
// flip/hover cohort widgets) is built in future tickets — Single-Cell NCIATWP-10324,
// Spatial NCIATWP-10325. For now this gives the top-level nav entries a real target.
export default function AtlasSummary({ title }) {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">{title}</h1>
      <hr />
      <p className="text-muted">This summary page is coming soon.</p>
    </Container>
  );
}
