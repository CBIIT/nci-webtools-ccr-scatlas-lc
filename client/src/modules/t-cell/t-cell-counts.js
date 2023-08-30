import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import { cd4StatsQuery, plotOptionsState, cd4Query, cd8Query, tCellQuery } from "./t-cell.state";

export default function TCellCounts() {
  const geneCounts = useRecoilValue(cd4StatsQuery);
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const setGene = useCallback(
    (gene) => {
      window.scrollTo(0, 0);
      setPlotOptions({ ...plotOptions, gene });
    },
    [plotOptions, setPlotOptions],
  );
  const cd4QueryV = useRecoilValue(cd4Query);
  const cd8QueryV = useRecoilValue(cd8Query);
  const tCellQueryV = useRecoilValue(tCellQuery);

  const columns = useMemo(
    (_) => [
      {
        accessor: "gene",
        Header: "Gene",
        Filter: TextFilter,
        Cell: ({ value }) => (
          <Button
            variant="link"
            className="p-0"
            onClick={(_) => setGene(value)}>
            {value}
          </Button>
        ),
        placeholder: "Enter gene",
        aria: "T Cell Gene",
      },
      {
        Header: "T Cells Expressing",
        accessor: "t_cell_count",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "T Cell Expressing",
        Cell: ({ value }) => (
          <span>
            {(value / tCellQueryV.length*100).toFixed(1)}
          </span>
        ),
      },
      {
        Header: "CD4+ T Cells Expressing",
        accessor: "cd4_cell_count",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "CD4+ Expressing",
        Cell: ({ value }) => (
          <span>
            {(value / cd4QueryV.length*100).toFixed(1)}
          </span>
        ),
      },
      {
        Header: "CD8+ T Cells Expressing",
        accessor: "cd8_cell_count",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "CD8+ Expressing",
        Cell: ({ value }) => (
          <span>
            {(value / cd8QueryV.length*100).toFixed(1)}
          </span>
        ),
      },
    ],
    [setGene],
  );

  const data = useMemo((_) => geneCounts, [geneCounts]);

  const sortBy = useMemo((_) => [{ id: "gene", desc: false }], []);

  const options = {
    initialState: { sortBy },
    defaultCanSort: true,
  };

  return <Table columns={columns} data={data} options={options} />;
}
