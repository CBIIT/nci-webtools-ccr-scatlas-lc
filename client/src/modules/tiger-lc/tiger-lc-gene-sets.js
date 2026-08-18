import { useRecoilState, useRecoilValue } from "recoil";
import GeneSetPanel from "../components/gene-set-panel";
import {
  geneSetsState,
  cellsStatsQuery,
  plotOptionsState,
} from "./tiger-lc.state";

// Connects the shared GeneSetPanel to TIGER-LC state: the session-only geneSetsState
// atom, the known gene list (from the per-gene stats table, used to validate genes
// pasted into the create modal), and the shared activeFeature that colors the plot.
// Coloring by a set and the single Gene box write the same activeFeature, so they are
// mutually exclusive by construction — activating one visually clears the other.
export default function TigerLcGeneSets() {
  const [sets, setSets] = useRecoilState(geneSetsState);
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const stats = useRecoilValue(cellsStatsQuery);
  const geneOptions = stats.map((s) => s.gene);

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
          ? null
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
  // set it starts a fresh subset of just that gene; emptying the subset
  // reverts to cell-type coloring.
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
  // only members that still exist. Emptied → fall back to cell-type coloring.
  function commitGenes(setId, genes) {
    const next = sets.map((s) => (s.id === setId ? { ...s, genes } : s));
    setSets(next);
    if (activeSetId === setId) {
      const set = next.find((s) => s.id === setId);
      setPlotOptions((prev) => {
        const wasFull = prev.activeFeature.genes.length === prev.activeFeature.setSize;
        const nextGenes = wasFull
          ? genes
          : prev.activeFeature.genes.filter((g) => genes.includes(g));
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

  function handleAddGene(set, gene) {
    if (set.genes.includes(gene)) return; // already a member
    commitGenes(set.id, [...set.genes, gene]);
  }

  function handleRemoveGene(set, gene) {
    commitGenes(
      set.id,
      set.genes.filter((g) => g !== gene),
    );
  }

  function handleDelete(set) {
    setSets(sets.filter((s) => s.id !== set.id));
    // deleting the active set reverts the plot to cell-type coloring
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
      onAddGene={handleAddGene}
      onRemoveGene={handleRemoveGene}
      onDelete={handleDelete}
    />
  );
}
