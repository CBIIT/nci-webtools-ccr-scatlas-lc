import { useRecoilState, useRecoilValue } from "recoil";
import GeneSetPanel from "../components/gene-set-panel";
import { useSingleCellCohort } from "./single-cell-cohort-context";

// Connects the shared GeneSetPanel to a single-cell cohort's state: the
// session-only geneSetsState atom, the known gene list (the union across the
// page's panels), and the shared activeFeature that colors the panels.
// Adapted from the spatial connector with one difference: deactivating a set
// (emptying its subset, or deleting it while active) snaps back to NULL — the
// cell-type cluster view — rather than to the default gene, matching what the
// gene box's × does on these pages.
export default function SingleCellCohortGeneSets() {
  const { geneSetsState, plotOptionsState, unionGenesQuery } =
    useSingleCellCohort();
  const [sets, setSets] = useRecoilState(geneSetsState);
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const geneOptions = useRecoilValue(unionGenesQuery);

  const active = plotOptions.activeFeature;
  const activeSetId = active?.kind === "set" ? active.setId : null;
  // the toggled genes of the active set (a "subset"); coloring is their mean.
  // Subsets are not remembered per set — they live only in activeFeature.
  const activeGenes = active?.kind === "set" ? active.genes : [];

  function handleCreate(set) {
    setSets([...sets, { id: crypto.randomUUID(), ...set }]);
  }

  function setFeature(set, genes) {
    setPlotOptions({
      ...plotOptions,
      activeFeature:
        genes.length === 0
          ? null // back to the cell-type cluster view
          : {
              kind: "set",
              setId: set.id,
              label: set.name,
              genes,
              setSize: set.genes.length,
            },
    });
  }

  // Set-level teardrop always means "the whole set": with a partial subset
  // active it resets to the full set; only when the full set is already active
  // does it revert to cell-type coloring.
  function handleColorBy(set) {
    const isFullActive =
      activeSetId === set.id && activeGenes.length === set.genes.length;
    setFeature(set, isFullActive ? [] : set.genes);
  }

  // Per-gene teardrop: toggles the gene in the active subset. On an inactive
  // set it starts a fresh subset of just that gene; emptying the subset snaps
  // back to the cluster view.
  function handleToggleGene(set, gene) {
    if (activeSetId !== set.id) {
      setFeature(set, [gene]);
      return;
    }
    setFeature(
      set,
      activeGenes.includes(gene)
        ? activeGenes.filter((g) => g !== gene)
        : [...activeGenes, gene],
    );
  }

  // Update a set's members and, if it is the one currently coloring the plot,
  // recompute live: full-set coloring follows the edit; a partial subset keeps
  // only members that still exist. Emptied → snap back to the cluster view.
  function commitGenes(setId, genes) {
    const next = sets.map((s) => (s.id === setId ? { ...s, genes } : s));
    setSets(next);
    if (activeSetId === setId) {
      const set = next.find((s) => s.id === setId);
      setPlotOptions((prev) => {
        // the active feature can have moved on by dispatch time — only a
        // feature still pointing at THIS set is ours to rewrite
        const feature = prev.activeFeature;
        if (feature?.kind !== "set" || feature.setId !== setId) return prev;
        const wasFull = feature.genes.length === feature.setSize;
        const nextGenes = wasFull
          ? genes
          : feature.genes.filter((g) => genes.includes(g));
        return {
          ...prev,
          activeFeature:
            nextGenes.length === 0
              ? null
              : {
                  kind: "set",
                  setId,
                  label: set.name,
                  genes: nextGenes,
                  setSize: genes.length,
                },
        };
      });
    }
  }

  // full-membership updates from the panel's multi-select picker (checking
  // adds, unchecking removes); membership adopts the picker's alphabetical order
  function handleSetGenes(set, genes) {
    commitGenes(set.id, genes);
  }

  function handleRemoveGene(set, gene) {
    commitGenes(
      set.id,
      set.genes.filter((g) => g !== gene),
    );
  }

  function handleDelete(set) {
    setSets(sets.filter((s) => s.id !== set.id));
    // deleting the active set snaps back to the cluster view
    if (activeSetId === set.id) {
      setPlotOptions((prev) => ({ ...prev, activeFeature: null }));
    }
  }

  return (
    <GeneSetPanel
      sets={sets}
      geneOptions={geneOptions}
      activeSetId={activeSetId}
      activeGenes={activeGenes}
      onCreate={handleCreate}
      onColorBy={handleColorBy}
      onToggleGene={handleToggleGene}
      onSetGenes={handleSetGenes}
      onRemoveGene={handleRemoveGene}
      onDelete={handleDelete}
    />
  );
}
