import { Container } from "react-bootstrap";
import EuropeanIcca from "../../european-icca/european-icca";

// Spatial Atlas → Transcriptomics → European iCCA page. Reached from the main
// menu and the Spatial Atlas summary; route /spatial/transcriptomics/european.
export default function EuropeanIccaPage() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">European iCCA</h1>
      <hr />
      <EuropeanIcca />
    </Container>
  );
}
