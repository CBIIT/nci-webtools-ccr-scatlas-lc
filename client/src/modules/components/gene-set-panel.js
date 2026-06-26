import { useState } from "react";
import Button from "react-bootstrap/Button";
import Select from "./select";
import CreateGeneSetModal from "./create-gene-set-modal";

// Smallest "Gene Set N" (N >= 1) not already taken, used to prefill the create modal.
function nextDefaultName(existingNames) {
  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  let n = 1;
  while (taken.has(`gene set ${n}`)) n += 1;
  return `Gene Set ${n}`;
}

// Shared "Gene Sets" panel: lists the user's named gene sets and a Create-new action.
// Each set is collapsible; expanded it shows its members (each removable) and a gene
// autocomplete to add more, plus a delete control. The teardrop colors the plot by the
// set's mean expression. Presentational + prop-driven (state in, callbacks out) so the
// proteomics page (10326) can reuse it. Kept modular so it can move to a right-side rail.
export default function GeneSetPanel({
  sets,
  geneOptions,
  activeSetId,
  onCreate,
  onColorBy,
  onAddGene,
  onRemoveGene,
  onDelete,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState({});
  const existingNames = sets.map((s) => s.name);

  function handleCreate(set) {
    onCreate(set);
    setShowCreate(false);
  }

  function toggleExpanded(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Gene Sets</h6>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() => setShowCreate(true)}>
          Create new
        </Button>
      </div>
      {sets.length === 0 ? (
        <div className="text-muted small">
          No gene sets yet. Create one to color the plot by its mean expression.
        </div>
      ) : (
        <ul className="list-group">
          {sets.map((set) => {
            const isActive = set.id === activeSetId;
            const isEmpty = set.genes.length === 0;
            const isOpen = !!expanded[set.id];
            return (
              <li key={set.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      size="sm"
                      variant={isActive ? "primary" : "outline-secondary"}
                      className="py-0 px-1 lh-1"
                      disabled={isEmpty}
                      title={
                        isEmpty
                          ? "Add genes to color the plot by this set"
                          : "Color the plot by this set's mean expression"
                      }
                      aria-label={`Color the plot by ${set.name}`}
                      aria-pressed={isActive}
                      onClick={() => onColorBy(set)}>
                      <i className="bi bi-droplet-fill" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none text-reset"
                      aria-expanded={isOpen}
                      onClick={() => toggleExpanded(set.id)}>
                      <i
                        className={`bi bi-chevron-${isOpen ? "down" : "right"} me-1 small`}
                        aria-hidden="true"
                      />
                      {set.name}
                    </Button>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">
                      {set.genes.length} gene{set.genes.length === 1 ? "" : "s"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="py-0 px-1 lh-1"
                      title="Delete set"
                      aria-label={`Delete ${set.name}`}
                      onClick={() => onDelete(set)}>
                      <i className="bi bi-trash" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-2">
                    {isEmpty ? (
                      <div className="text-muted small mb-2">No genes yet.</div>
                    ) : (
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {set.genes.map((gene) => (
                          <span
                            key={gene}
                            className="badge text-bg-light border d-inline-flex align-items-center gap-1">
                            {gene}
                            <button
                              type="button"
                              className="btn-close"
                              style={{ fontSize: "0.5rem" }}
                              aria-label={`Remove ${gene}`}
                              onClick={() => onRemoveGene(set, gene)}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      className="position-relative"
                      style={{ maxWidth: "280px" }}>
                      <Select
                        name={`add-gene-${set.id}`}
                        label="Add gene"
                        className="form-control form-control-sm"
                        options={geneOptions}
                        placeholder="Add gene…"
                        value={null}
                        onChange={(gene) => {
                          if (gene && gene !== "All genes") onAddGene(set, gene);
                        }}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {showCreate && (
        <CreateGeneSetModal
          show={showCreate}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          geneOptions={geneOptions}
          existingNames={existingNames}
          defaultName={nextDefaultName(existingNames)}
        />
      )}
    </div>
  );
}
