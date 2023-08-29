import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import { geneCountsQuery, plotOptionsState , malignantCellsQuery} from "./tumor-cell.state";

export default function TumorCellCounts() {
  const geneCounts = useRecoilValue(geneCountsQuery);
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const setGene = useCallback(
    (gene) => {
      window.scrollTo(0, 0);
      setPlotOptions({ ...plotOptions, gene });
    },
    [plotOptions, setPlotOptions],
  );
  const malignantCell = useRecoilValue(malignantCellsQuery);

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
        accessor: "malignant_cell_count",
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: "Tumor Cell Expressing",
        Cell: ({ value }) => (
          <span>
            {(value / malignantCell.records.length*100).toFixed(1)}
          </span>
        ),
      },
    ],
    [setGene],
  );

  const data = useMemo((_) => geneCounts.records, [geneCounts]);

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
