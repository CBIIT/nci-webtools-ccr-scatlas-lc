import { Container } from "react-bootstrap";
import SpatialMultiRegional from "../../spatial-multi-regional/spatial-multi-regional";

// Spatial Atlas → Transcriptomics → Multi-Regional page. Reached from the main
// menu and the Spatial Atlas summary; route /spatial/transcriptomics/multi-regional.
export default function SpatialMultiRegionalPage() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">Multi-Regional</h1>
      <hr />
      <SpatialMultiRegional />
    </Container>
  );
}
