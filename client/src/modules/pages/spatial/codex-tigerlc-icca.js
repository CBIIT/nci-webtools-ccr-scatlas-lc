import { Container } from "react-bootstrap";
import CodexTigerLcIcca from "../../codex-tigerlc-icca/codex-tigerlc-icca";

// Spatial Atlas → Proteomics → TIGER-LC iCCA page. Reached from the main menu
// and the Spatial Atlas summary; route /spatial/proteomics/tiger-lc-icca.
export default function CodexTigerLcIccaPage() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">TIGER-LC iCCA</h1>
      <hr />
      <CodexTigerLcIcca />
    </Container>
  );
}
