import { useState } from "react";
import Button from "react-bootstrap/Button";
import CreateGeneSetModal from "./create-gene-set-modal";

// Smallest "Gene Set N" (N >= 1) not already taken, used to prefill the create modal.
function nextDefaultName(existingNames) {
  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  let n = 1;
  while (taken.has(`gene set ${n}`)) n += 1;
  return `Gene Set ${n}`;
}

// Shared "Gene Sets" panel: lists the user's named gene sets and a Create-new action.
// Presentational + prop-driven (sets in, onCreate out) so the proteomics page (10326)
// can reuse it. Coloring the plot by a set, member add/remove, and delete are wired in
// later steps. Kept modular so it can move to a right-side rail later if needed.
export default function GeneSetPanel({
  sets,
  geneOptions,
  activeSetId,
  onCreate,
  onColorBy,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const existingNames = sets.map((s) => s.name);

  function handleCreate(set) {
    onCreate(set);
    setShowCreate(false);
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
            return (
              <li
                key={set.id}
                className="list-group-item d-flex justify-content-between align-items-center">
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
                  <span>{set.name}</span>
                </div>
                <span className="text-muted small">
                  {set.genes.length} gene{set.genes.length === 1 ? "" : "s"}
                </span>
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
