import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import { statsTableQuery, plotOptionsState } from "./tiger-lc.state";

const CELL_TYPES = ["Malignant", "Immune", "Stromal", "Epithelial"];

// Statistics table below the TIGER-LC plots: the client-provided per-cell-type
// stats sourced verbatim from stats_table_tigerlc.csv; headers are prettified
// (MeanExpression_X -> "Normalized Expression (X)", PercentageExpression_X ->
// "% Expression (X)" \u2014 matching the Single-cell tables' wording). Same
// pagination/filtering as the Single-cell Cell Counts tables. Rows of the active selection are highlighted — single
// gene, or every gene of the active set/subset (the table pages to the first;
// multi-page behavior refinement pending NCIATWP-11121). Clicking a Feature
// makes it the active single gene, mirroring the Single-cell tables.
export default function TigerLcStatsTable() {
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
      ...CELL_TYPES.map((type) => ({
        Header: `% Expression (${type})`,
        accessor: `PercentageExpression_${type}`,
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: `Percentage Expression ${type}`,
        Cell: ({ value }) => <span>{Number(value).toFixed(1)}</span>,
      })),
      ...CELL_TYPES.map((type) => ({
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
    [setGene],
  );

  const sortBy = useMemo(() => [{ id: "gene", desc: false }], []);
  const activeGenes = useRecoilValue(plotOptionsState).activeFeature?.genes;

  return (
    <div className="tigerlc-stats-table">
      <Table
        columns={columns}
        data={data}
        options={{ initialState: { sortBy }, defaultCanSort: true }}
        selectedGenes={activeGenes ?? []}
      />
    </div>
  );
}
