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

  return (
    <GeneSetPanel
      sets={sets}
      geneOptions={geneOptions}
      activeSetId={activeSetId}
      onCreate={handleCreate}
      onColorBy={handleColorBy}
    />
  );
}
