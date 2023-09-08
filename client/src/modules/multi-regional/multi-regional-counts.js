import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import { tumorCellsStatsQuery, normalCellsStatsQuery, plotOptionsState , tumorCellsQuery} from "./multi-regional.state";

export default function MultiRegionalCellCounts() {
  const tumorStats = useRecoilValue(tumorCellsStatsQuery);
  const normalStats = useRecoilValue(normalCellsStatsQuery);
  const geneCounts =  tumorStats.map((tumor, i) => {
    return({
      gene: tumor.gene,
      tumor_cell_count: tumor.count,
      tumor_cell_mean: tumor.mean.toExponential(6),
      normal_cell_count: normalStats[i].count,
      normal_cell_mean: normalStats[i].mean.toExponential(6)
    })
  })

  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const setGene = useCallback(
    (gene) => {
      window.scrollTo(0, 0);
      setPlotOptions({ ...plotOptions, gene });
    },
    [plotOptions, setPlotOptions],
  );
  const tumorCell = useRecoilValue(tumorCellsQuery);

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
        Header: "Cells Expressing",
        accessor: "tumor_cell_count",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "Tumor Cell Expressing",
        Cell: ({ value }) => (
          <span>
            {(value / tumorCell.length*100).toFixed(1)}
          </span>
        ),
      },
    ],
    [setGene],
  );

  const data = useMemo((_) => geneCounts, [geneCounts]);

  const sortBy = useMemo(
    (_) => [{ id: "gene", desc: false }],
    [],
  );

  const options = {
    initialState: { sortBy },
    defaultCanSort: true,
  };

  return <Table columns={columns} data={data} options={options} />;
}
