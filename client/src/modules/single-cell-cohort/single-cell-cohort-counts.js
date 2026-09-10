import { useMemo, useCallback } from "react";
import { useRecoilValue, useRecoilState } from "recoil";
import Button from "react-bootstrap/Button";
import Table, { TextFilter, RangeFilter } from "../components/table";
import { useSingleCellCohort } from "./single-cell-cohort-context";

// Per-gene counts across the cohort's panels: % of cells expressing and mean
// expression per panel, one row per gene. Rows are joined BY GENE NAME — the
// legacy modules zipped the panels' stats arrays by index, which silently
// mis-pairs rows if the tables ever disagree in order or content. A gene a
// panel lacks renders "—" in that panel's columns.
export default function SingleCellCohortCounts() {
  const { config, panels, allStatsQuery, plotOptionsState } =
    useSingleCellCohort();
  const allStats = useRecoilValue(allStatsQuery);
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);

  // counts columns show the configured panels in the configured order
  const countPanels = useMemo(
    () =>
      config.countsColumns.map((panelId) => {
        const index = panels.findIndex((p) => p.id === panelId);
        return { ...panels[index], stats: allStats[index] };
      }),
    [config.countsColumns, panels, allStats],
  );

  const geneCounts = useMemo(() => {
    const statsByGene = countPanels.map(
      (panel) => new Map(panel.stats.map((s) => [s.gene, s])),
    );
    const genes = [
      ...new Set(countPanels.flatMap((panel) => panel.stats.map((s) => s.gene))),
    ];
    return genes.map((gene) => {
      const row = { gene };
      countPanels.forEach((panel, i) => {
        const stats = statsByGene[i].get(gene);
        row[`${panel.id}_percent`] = stats?.percent ?? null;
        row[`${panel.id}_mean`] = stats?.mean ?? null;
      });
      return row;
    });
  }, [countPanels]);

  const setGene = useCallback(
    (gene) => {
      window.scrollTo(0, 0);
      setPlotOptions({
        ...plotOptions,
        activeFeature: { kind: "gene", label: gene, genes: [gene] },
      });
    },
    [plotOptions, setPlotOptions],
  );

  const formatCell = (digits) =>
    function FormattedCell({ value }) {
      return <span>{value == null ? "—" : Number(value).toFixed(digits)}</span>;
    };

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
        aria: `${countPanels[0].countsAria} Gene`,
      },
      ...countPanels.map((panel) => ({
        Header: `% Cells Expressing (${panel.countsLabel})`,
        accessor: `${panel.id}_percent`,
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min percent",
        maxPlaceholder: "Enter max percent",
        aria: `${panel.countsAria} Expressing`,
        Cell: formatCell(1),
      })),
      ...countPanels.map((panel) => ({
        Header: `Normalized Expression Levels (${panel.countsLabel})`,
        accessor: `${panel.id}_mean`,
        Filter: RangeFilter,
        filter: "between",
        minPlaceholder: "Enter min mean",
        maxPlaceholder: "Enter max mean",
        aria: `${panel.countsAria} Mean`,
        Cell: formatCell(2),
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setGene, countPanels],
  );

  const sortBy = useMemo((_) => [{ id: "gene", desc: false }], []);

  const options = {
    initialState: { sortBy },
    defaultCanSort: true,
  };

  return (
    <Table
      columns={columns}
      data={geneCounts}
      options={options}
      selectedGenes={plotOptions.activeFeature?.genes ?? []}
    />
  );
}
