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

  function handleCreate(set) {
    setSets([...sets, { id: crypto.randomUUID(), ...set }]);
  }

  function handleColorBy(set) {
    // toggle: clicking the active set's teardrop reverts to cell-type coloring
    const activeFeature =
      activeSetId === set.id
        ? null
        : { kind: "set", setId: set.id, label: set.name, genes: set.genes };
    setPlotOptions({ ...plotOptions, activeFeature });
  }

  // Update a set's members and, if it is the one currently coloring the plot, recompute
  // live. An active set emptied of its last gene can no longer be a mean, so fall back
  // to cell-type coloring.
  function commitGenes(setId, genes) {
    const next = sets.map((s) => (s.id === setId ? { ...s, genes } : s));
    setSets(next);
    if (activeSetId === setId) {
      const set = next.find((s) => s.id === setId);
      setPlotOptions((prev) => ({
        ...prev,
        activeFeature:
          genes.length === 0
            ? null
            : { kind: "set", setId, label: set.name, genes },
      }));
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
      onCreate={handleCreate}
      onColorBy={handleColorBy}
      onAddGene={handleAddGene}
      onRemoveGene={handleRemoveGene}
      onDelete={handleDelete}
    />
  );
}
