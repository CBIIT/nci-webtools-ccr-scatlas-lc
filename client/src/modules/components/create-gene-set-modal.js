import { useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

// Modal to create a named gene set. The name is required, prefilled (editable) and
// must be unique (case-insensitive) among existing sets. Genes are optional: pasted
// comma/space/newline-separated, matched to the known panel case-insensitively,
// deduped, with unknown symbols dropped and surfaced in a small notice. An empty set
// is allowed (members can be added later). Prop-driven so the proteomics page (10326)
// can reuse it for protein sets.
export default function CreateGeneSetModal({
  show,
  onClose,
  onCreate,
  geneOptions,
  existingNames,
  defaultName,
}) {
  const [name, setName] = useState(defaultName);
  const [genesText, setGenesText] = useState("");

  // canonical-symbol lookup, lowercased -> as-listed in the panel
  const geneIndex = useMemo(() => {
    const m = new Map();
    for (const g of geneOptions) m.set(g.toLowerCase(), g);
    return m;
  }, [geneOptions]);

  // live preview: split on commas/whitespace, match case-insensitively, dedupe,
  // and collect anything we don't recognize so we can warn before creating
  const { matched, unknown } = useMemo(() => {
    const tokens = genesText.split(/[\s,]+/).filter(Boolean);
    const matched = [];
    const unknown = [];
    const seen = new Set();
    for (const t of tokens) {
      const canon = geneIndex.get(t.toLowerCase());
      if (canon) {
        if (!seen.has(canon)) {
          seen.add(canon);
          matched.push(canon);
        }
      } else if (!unknown.some((u) => u.toLowerCase() === t.toLowerCase())) {
        unknown.push(t);
      }
    }
    return { matched, unknown };
  }, [genesText, geneIndex]);

  const trimmedName = name.trim();
  const nameTaken = existingNames.some(
    (n) => n.toLowerCase() === trimmedName.toLowerCase(),
  );
  const nameError = !trimmedName
    ? "Name is required."
    : nameTaken
      ? "A gene set with this name already exists."
      : null;

  function handleCreate() {
    if (nameError) return;
    onCreate({ name: trimmedName, genes: matched });
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create gene set</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="gene-set-name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isInvalid={!!nameError}
            autoFocus
          />
          <Form.Control.Feedback type="invalid">
            {nameError}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-2" controlId="gene-set-genes">
          <Form.Label>Genes (optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={genesText}
            onChange={(e) => setGenesText(e.target.value)}
            placeholder="Paste gene symbols separated by commas, spaces, or new lines"
          />
        </Form.Group>
        {matched.length > 0 && (
          <div className="small text-muted">
            {matched.length} gene{matched.length === 1 ? "" : "s"} matched.
          </div>
        )}
        {unknown.length > 0 && (
          <div className="small text-warning">
            Dropped {unknown.length} unknown symbol
            {unknown.length === 1 ? "" : "s"}: {unknown.join(", ")}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={!!nameError}>
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
