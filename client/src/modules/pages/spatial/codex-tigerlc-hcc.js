import { Container } from "react-bootstrap";
import CodexTigerLcHcc from "../../codex-tigerlc-hcc/codex-tigerlc-hcc";

// Spatial Atlas → Proteomics → TIGER-LC HCC page. Reached from the main menu
// and the Spatial Atlas summary; route /spatial/proteomics/tiger-lc-hcc.
export default function CodexTigerLcHccPage() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">TIGER-LC HCC</h1>
      <hr />
      <CodexTigerLcHcc />
    </Container>
  );
}
