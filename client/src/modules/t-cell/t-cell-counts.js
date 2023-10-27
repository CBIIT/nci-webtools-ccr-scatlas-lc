import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import {
  cd4StatsQuery,
  cd8StatsQuery,
  tCellStatsQuery,
  plotOptionsState,
  cd4Query,
  cd8Query,
  tCellQuery,
} from "./t-cell.state";

export default function TCellCounts() {
  const cd4Stats = useRecoilValue(cd4StatsQuery);
  const cd8Stats = useRecoilValue(cd8StatsQuery);
  const tCellStats = useRecoilValue(tCellStatsQuery);

  const geneCounts = cd4Stats.map((cd4, i) => {
    return {
      gene: cd4.gene,
      cd4_cell_count: cd4.count,
      cd4_cell_percent: cd4.percent,
      cd4_cell_mean: cd4.mean.toExponential(6),
      cd8_cell_count: cd8Stats[i].count,
      cd8_cell_percent: cd8Stats[i].percent,
      cd8_cell_mean: cd8Stats[i].mean.toExponential(6),
      t_cell_count: tCellStats[i].count,
      t_cell_percent: tCellStats[i].percent,
      t_cell_mean: tCellStats[i].mean.toExponential(6),
    };
  });

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
        Header: "% Cells Expressing (T cells)",
        accessor: "t_cell_percent",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "T Cell Expressing",
        Cell: ({ value }) => <span>{Number(value).toFixed(1)}</span>,
      },
      {
        Header: "Normalized Expression Level (T Cells)",
        accessor: "t_cell_mean",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min mean",
        maxPlaceholder: "Enter max mean",
        aria: "T Cell Mean",
        Cell: ({ value }) => <span>{Number(value).toFixed(2)}</span>,
      },
      {
        Header: "% Cells Expressing (CD4+)",
        accessor: "cd4_cell_percent",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "CD4+ Expressing",
        Cell: ({ value }) => <span>{Number(value).toFixed(1)}</span>,
      },
      {
        Header: "Normalized Expression Level (CD4+)",
        accessor: "cd4_cell_mean",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min mean",
        maxPlaceholder: "Enter max mean",
        aria: "CD4+ Mean",
        Cell: ({ value }) => <span>{Number(value).toFixed(2)}</span>,
      },
      {
        Header: "% Cells Expressing (CD8+)",
        accessor: "cd8_cell_percent",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "CD8+ Expressing",
        Cell: ({ value }) => <span>{Number(value).toFixed(1)}</span>,
      },
      {
        Header: "Normalized Expression Level (CD8+)",
        accessor: "cd8_cell_mean",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min mean",
        maxPlaceholder: "Enter max mean",
        aria: "CD8+ Mean",
        Cell: ({ value }) => <span>{Number(value).toFixed(2)}</span>,
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

  return (
    <Table
      columns={columns}
      data={data}
      options={options}
      selectedGene={plotOptions.gene}
    />
  );
}
