import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import { useSpatialCohort } from "./spatial-cohort-context";

// Statistics table below a cohort's plots: the client-provided per-cell-type
// stats sourced verbatim from its stats_table CSV; headers are prettified
// (MeanExpression_X -> "Normalized Expression (X)", PercentageExpression_X ->
// "% Expression (X)" — matching the Single-cell tables' wording, percentages
// first). Same pagination/filtering as the Single-cell Cell Counts tables.
// Rows of the active selection pin to the top — single gene, or every gene of
// the active set/subset. Clicking a gene makes it the active single gene,
// mirroring the Single-cell tables.
export default function SpatialCohortStatsTable() {
  const { config, statsTableQuery, plotOptionsState } = useSpatialCohort();
  const stats = useRecoilValue(statsTableQuery);
  const [, setPlotOptions] = useRecoilState(plotOptionsState);

  const setGene = useCallback(
    (gene) => {
      setPlotOptions((prev) => ({
        ...prev,
        activeFeature: { kind: "gene", label: gene, genes: [gene] },
      }));
    },
    [setPlotOptions],
  );

  // the shared Table highlights by row.original.gene
  const data = useMemo(
    () => stats.map((row) => ({ ...row, gene: row.Feature })),
    [stats],
  );

  const columns = useMemo(
    () => [
      {
        accessor: "gene",
        Header: "Gene",
        Filter: TextFilter,
        placeholder: "Enter gene",
        aria: "Gene",
        Cell: ({ value }) => (
          <Button variant="link" className="p-0" onClick={() => setGene(value)}>
            {value}
          </Button>
        ),
      },
      ...config.statsTableTypes.map((type) => ({
        Header: `% Expression (${type})`,
        // cell-type names may contain spaces ("T cell") — fine for DuckDB and
        // react-table alike, as long as they contain no dots (path accessors)
        accessor: `PercentageExpression_${type}`,
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: `Percentage Expression ${type}`,
        Cell: ({ value }) => <span>{Number(value).toFixed(1)}</span>,
      })),
      ...config.statsTableTypes.map((type) => ({
        Header: `Normalized Expression (${type})`,
        accessor: `MeanExpression_${type}`,
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min mean",
        maxPlaceholder: "Enter max mean",
        aria: `Mean Expression ${type}`,
        Cell: ({ value }) => <span>{Number(value).toFixed(2)}</span>,
      })),
    ],
    [setGene, config.statsTableTypes],
  );

  const sortBy = useMemo(() => [{ id: "gene", desc: false }], []);
  const activeGenes = useRecoilValue(plotOptionsState).activeFeature?.genes;

  return (
    <div className="spatial-stats-table">
      <Table
        columns={columns}
        data={data}
        options={{ initialState: { sortBy }, defaultCanSort: true }}
        selectedGenes={activeGenes ?? []}
      />
    </div>
  );
}
