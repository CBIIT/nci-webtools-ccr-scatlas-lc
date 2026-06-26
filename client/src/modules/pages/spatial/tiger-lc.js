import { Container } from "react-bootstrap";
import TigerLcCell from "../../tiger-lc/tiger-lc";

// Spatial Atlas → Transcriptomics → TIGER-LC page. Reached from the main menu and the
// Spatial Atlas summary; route /spatial/transcriptomics/tiger-lc.
export default function TigerLcPage() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">TIGER-LC</h1>
      <hr />
      <TigerLcCell />
    </Container>
  );
}
