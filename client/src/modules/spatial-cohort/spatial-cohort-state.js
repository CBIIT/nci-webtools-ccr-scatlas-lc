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
//   units           coordinate unit for the axis labels (default "mm"; CODEX
//                   drops ship pixel coordinates — "px")
//   mountMargin / unmountMargin   lazy-mount hysteresis distances
//   maxLiveRows     hard cap on simultaneously mounted rows (WebGL cohorts —
//                   a pixel margin scales with viewport height, a cap does not)
//   sampleCacheSize how many samples' records to keep (perSample). Covering the
//                   live rows is NOT the goal — a mounted row holds its own
//                   reference and hands it to fetchSampleFeature, so nothing on
//                   screen depends on the cache. It buys cheap scroll-back, and
//                   trades directly against the footprint this mode exists to
//                   bound, so it belongs well under the cohort's sample count.
const META_COLUMNS = "x,y,type,sample,cell_id";

// Bounded promise cache for the perSample fetchers. A Recoil selectorFamily
// cannot do this job: 0.7.7 hardcodes eviction "keep-all" for a family's params
// cache (cachePolicyForParams_UNSTABLE only tunes key equality), so every
// sample a user scrolled past would be retained for the life of the page —
// the whole-table footprint that perSample fetching exists to avoid. An
// insertion-ordered Map gives LRU for free: re-reading a key re-inserts it at
// the end, and the oldest key is always the first one out.
function createLruCache(maxSize) {
  const entries = new Map();
  return function load(key, fetcher) {
    if (entries.has(key)) {
      const hit = entries.get(key);
      entries.delete(key);
      entries.set(key, hit);
      return hit;
    }
    const pending = fetcher();
    entries.set(key, pending);
    // a failed fetch must not be cached — the row retries on its next remount.
    // Only drop the entry if it is still THIS promise: a slow rejection can
    // land long after its key was evicted and re-fetched, and must not take
    // the newer successful entry down with it.
    pending.catch(() => {
      if (entries.get(key) === pending) entries.delete(key);
    });
    while (entries.size > maxSize) entries.delete(entries.keys().next().value);
    return pending;
  };
}

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

  // One sample's cells (perSample mode), fetched on demand and retained only
  // by the LRU below — rows drop their own reference when they scroll out of
  // the mount window, so the page never holds every sample at once. The cache
  // exists for cheap scroll-back, NOT for correctness: a live row holds its own
  // reference, so the budget can stay well under the cohort's sample count.
  const cacheSize = config.sampleCacheSize ?? 6;
  const loadSampleCells = createLruCache(cacheSize);
  const fetchSampleCells = (sample) =>
    loadSampleCells(sample, () =>
      query("/api/query", {
        table: tables.cells,
        columns: META_COLUMNS,
        sample,
      }),
    );

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

  // perSample-mode variant: fetches and joins one sample's expression only,
  // keyed by sample + gene list. `cells` is the caller's already-loaded records
  // for this sample; passing them keeps the two caches independent, which is
  // what lets both stay small. Deriving the cells here instead would make the
  // cells budget a correctness constraint — it would have to outnumber the
  // live rows or a gene change would re-download cells the rows are still
  // displaying. Falls back to the cells cache for a row that has not resolved
  // its own copy yet (the row's fetch is already in flight under the same key,
  // so this shares that promise rather than issuing a second query).
  //
  // Sized to match the cells budget rather than under it. Its entries ARE a
  // second full copy of the records (joinFeature rebuilds each cell), but an
  // entry for a live row is the same array that row already holds, so the
  // marginal cost is only the recently-departed rows — and undersizing it
  // meant a scroll-back re-queried and re-joined every sample, which is the
  // work the cache exists to skip.
  const loadSampleFeature = createLruCache(cacheSize);
  const fetchSampleFeature = (sample, genesKey, cells) => {
    if (!genesKey) return Promise.resolve([]); // as featureExpressionQuery
    return loadSampleFeature(`${sample}\u0000${genesKey}`, async () => {
      const genes = genesKey.split(",");
      const [baseCells, rows] = await Promise.all([
        cells ?? fetchSampleCells(sample),
        query("/api/query", {
          table: tables.cells,
          columns: `cell_id,${genes.join(",")}`,
          sample,
        }),
      ]);
      return joinFeature(baseCells, rows, genes);
    });
  };

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
    fetchSampleCells,
    samplesQuery,
    cellsStatsQuery,
    statsTableQuery,
    featureExpressionQuery,
    fetchSampleFeature,
    defaultPlotOptions,
    plotOptionsState,
    geneSetsState,
  };
}
