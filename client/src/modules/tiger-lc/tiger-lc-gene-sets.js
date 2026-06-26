import { useRecoilState, useRecoilValue } from "recoil";
import GeneSetPanel from "../components/gene-set-panel";
import { geneSetsState, cellsStatsQuery } from "./tiger-lc.state";

// Connects the shared GeneSetPanel to TIGER-LC state: the session-only geneSetsState
// atom and the known gene list (from the per-gene stats table, used to validate the
// genes pasted into the create modal).
export default function TigerLcGeneSets() {
  const [sets, setSets] = useRecoilState(geneSetsState);
  const stats = useRecoilValue(cellsStatsQuery);
  const geneOptions = stats.map((s) => s.gene);

  function handleCreate(set) {
    setSets([...sets, { id: crypto.randomUUID(), ...set }]);
  }

  return (
    <GeneSetPanel sets={sets} geneOptions={geneOptions} onCreate={handleCreate} />
  );
}
