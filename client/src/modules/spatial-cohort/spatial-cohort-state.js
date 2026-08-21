import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

// State factory for a spatial cohort page. Each cohort calls this once at
// module scope with its config and renders <SpatialCohortPage state={...}> —
// the returned bundle carries every atom/selector the composed components
// need, namespaced by config.id so multiple cohorts coexist in one Recoil root.
//
// config:
//   id              unique key prefix, e.g. "tigerlc"
//   title           plots heading, e.g. "TIGER-LC iCCA"
//   tables          { cells, stats, statsTable } DuckDB table names
//   cellTypeColors  { [type]: color } for the cell-type plot/legend
//   statsTableTypes cell types (display order) for the statistics table columns
//   defaultGene     the always-active default feature (clearing snaps back)
//   fetch           "full"  — download the whole cells table once (small cohorts)
//                   "perSample" — fetch each sample's cells on demand via the
//                   API's sample filter (large cohorts; requires `samples`)
//   samples         known sample ids (required for perSample; null = derive
//                   from the fetched cells)
//   renderer        Plotly trace type: "scatter" (SVG) or "scattergl" (WebGL)
//   mountMargin / unmountMargin   lazy-mount hysteresis distances
const META_COLUMNS = "x,y,type,sample,cell_id";

export function createSpatialCohortState(config) {
  const { id, tables } = config;

  // The full cells table: coords/types/samples for every cell. Only used in
  // "full" fetch mode — in perSample mode nothing may depend on it (it would
  // pull millions of rows).
  const cellsQuery = selector({
    key: `${id}.cellsQuery`,
    get: () =>
      query("/api/query", { table: tables.cells, columns: META_COLUMNS }),
  });

  // One sample's cells (perSample mode); null = not yet requested -> no fetch.
  const sampleCellsQuery = selectorFamily({
    key: `${id}.sampleCellsQuery`,
    get: (sample) => () =>
      sample == null
        ? []
        : query("/api/query", {
            table: tables.cells,
            columns: META_COLUMNS,
            sample,
          }),
  });

  // The sample id list drives the row list and the Samples filter. Configured
  // cohorts (perSample) list them statically; otherwise derive from the cells.
  const samplesQuery = selector({
    key: `${id}.samplesQuery`,
    get: ({ get }) =>
      config.samples ??
      [...new Set(get(cellsQuery).map((c) => c.sample))].sort(),
  });

  // Our computed per-gene stats — source of the known-genes list.
  const cellsStatsQuery = selector({
    key: `${id}.cellsStatsQuery`,
    get: () =>
      query("/api/query", {
        table: tables.stats,
        columns: "gene,count,mean,percent",
      }),
  });

  // The client-provided per-cell-type statistics table (verbatim columns:
  // Feature + MeanExpression_<type> + PercentageExpression_<type>). Display
  // source for the statistics table below the plots.
  const statsTableQuery = selector({
    key: `${id}.statsTableQuery`,
    get: () =>
      query("/api/query", {
        table: tables.statsTable,
        columns: [
          "Feature",
          ...config.statsTableTypes.map((t) => `MeanExpression_${t}`),
          ...config.statsTableTypes.map((t) => `PercentageExpression_${t}`),
        ].join(","),
      }),
  });

  // Color-by-feature: a "feature" is one or more genes (a single gene, or a
  // gene set). Fetches ONLY the feature's gene columns (keyed by cell_id) and
  // joins them onto the already-cached cells, so the base records never
  // re-download when the gene selection changes. Adds a per-cell `__value` =
  // mean across the genes. Keyed by a comma-joined gene list so Recoil caches
  // per feature. Empty list -> no rows.
  const joinFeature = (cells, rows, genes) => {
    const values = new Map();
    for (const r of rows) {
      let sum = 0;
      for (const g of genes) sum += +r[g] || 0;
      values.set(r.cell_id, sum / genes.length);
    }
    return cells.map((c) => ({ ...c, __value: values.get(c.cell_id) ?? 0 }));
  };

  // Full-mode variant: joins onto the whole cells table.
  const featureExpressionQuery = selectorFamily({
    key: `${id}.featureExpressionQuery`,
    get:
      (genesKey) =>
      async ({ get }) => {
        if (!genesKey) return [];
        const cells = get(cellsQuery);
        const genes = genesKey.split(",");
        const rows = await query("/api/query", {
          table: tables.cells,
          columns: `cell_id,${genes.join(",")}`,
        });
        return joinFeature(cells, rows, genes);
      },
  });

  // perSample-mode variant: fetches and joins one sample's expression only.
  const sampleFeatureQuery = selectorFamily({
    key: `${id}.sampleFeatureQuery`,
    get:
      ({ sample, genesKey }) =>
      async ({ get }) => {
        if (sample == null || !genesKey) return [];
        const cells = get(sampleCellsQuery(sample));
        const genes = genesKey.split(",");
        const rows = await query("/api/query", {
          table: tables.cells,
          columns: `cell_id,${genes.join(",")}`,
          sample,
        });
        return joinFeature(cells, rows, genes);
      },
  });

  // activeFeature: what colors the expression (right) plots —
  // { kind: "gene" | "set", label, genes: [...] }. A single gene is a 1-gene
  // feature; a set may carry a toggled subset (genes ⊆ the set, setSize = full
  // size). The cohort's default gene is always active when nothing is selected
  // — activeFeature is never null in practice.
  // samples: null = all samples selected (default); otherwise an array of ids.
  const defaultPlotOptions = {
    size: 4,
    opacity: 0.8,
    activeFeature: {
      kind: "gene",
      label: config.defaultGene,
      genes: [config.defaultGene],
    },
    samples: null,
    // experimental: when true, drag-zoom goes to the exact drawn rectangle
    // instead of snapping to the 1:1 mm aspect (allows stretch distortion)
    freeZoom: false,
  };

  const plotOptionsState = atom({
    key: `${id}.plotOptionsState`,
    default: defaultPlotOptions,
  });

  // Gene sets are session-only (in-memory Recoil): an array of
  // { id, name, genes: [] }. They survive in-app navigation but are lost on a
  // full refresh (same as the cellxgene reference). No caps on sets or genes.
  const geneSetsState = atom({
    key: `${id}.geneSetsState`,
    default: [],
  });

  return {
    config,
    cellsQuery,
    sampleCellsQuery,
    samplesQuery,
    cellsStatsQuery,
    statsTableQuery,
    featureExpressionQuery,
    sampleFeatureQuery,
    defaultPlotOptions,
    plotOptionsState,
    geneSetsState,
  };
}
