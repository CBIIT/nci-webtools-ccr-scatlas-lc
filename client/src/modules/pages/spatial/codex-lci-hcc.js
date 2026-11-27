import { Container } from "react-bootstrap";
import CodexLciHcc from "../../codex-lci-hcc/codex-lci-hcc";

// Spatial Atlas → Proteomics → LCI HCC page. Reached from the main menu and
// the Spatial Atlas summary; route /spatial/proteomics/lci-hcc.
export default function CodexLciHccPage() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">LCI HCC</h1>
      <hr />
      <CodexLciHcc />
    </Container>
  );
}
