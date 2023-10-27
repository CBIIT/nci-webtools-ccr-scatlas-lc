import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import {
  tumorCellsStatsQuery,
  plotOptionsState,
  normalCellsStatsQuery,
  tumorCellsQuery,
  normalCellsQuery,
} from "./tumor-cell.state";

export default function TumorCellCounts() {
  const tumorStats = useRecoilValue(tumorCellsStatsQuery);
  const normalStats = useRecoilValue(normalCellsStatsQuery);

  const geneCounts = tumorStats.map((tumor, i) => {
    return {
      gene: tumor.gene,
      tumor_cell_count: tumor.count,
      tumor_cell_mean: tumor.mean.toExponential(6),
      normal_cell_count: normalStats[i].count,
      normal_cell_mean: normalStats[i].mean.toExponential(6),
      tumor_cell_percent: tumor.percent,
      normal_cell_percent: normalStats[i].percent,
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
  const tumorCell = useRecoilValue(tumorCellsQuery);
  const normalCell = useRecoilValue(normalCellsQuery);
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
        aria: "Tumor Cell Gene",
      },
      {
        Header: "% Cells Expressing (Malignant)",
        accessor: "tumor_cell_percent",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "Tumor Cell Expressing",
        Cell: ({ value }) => <span>{Number(value).toFixed(1)}</span>,
      },
      {
        Header: "% Cells Expressing (Non-Malignant)",
        accessor: "normal_cell_percent",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "Normal Cell Expressing",
        Cell: ({ value }) => <span>{Number(value).toFixed(1)}</span>,
      },
      {
        Header: "Normalized Expression Levels (Malignant)",
        accessor: "tumor_cell_mean",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min mean",
        maxPlaceholder: "Enter max mean",
        aria: "Tumor Cell Mean",
        Cell: ({ value }) => <span>{Number(value).toFixed(2)}</span>,
      },
      {
        Header: "Normalized Expression Levels (Non-Malignant)",
        accessor: "normal_cell_mean",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min mean",
        maxPlaceholder: "Enter max mean",
        aria: "Normal Cell Mean",
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
