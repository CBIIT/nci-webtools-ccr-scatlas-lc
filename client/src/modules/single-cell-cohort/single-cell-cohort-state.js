import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

// State factory for a single-cell cohort page (the t-SNE/UMAP atlas pages:
// Tumor Cell Community, T-Cell, Multi-Regional, Sequential). Each cohort calls
// this once at module scope with its config and renders
// <SingleCellCohortPage state={...}> — the returned bundle carries every
// atom/selector the composed components need, namespaced by config.id.
//
// This is the single-cell sibling of createSpatialCohortState. The decisive
// difference: these tables have NO cell_id column, so expression cannot be
// fetched separately and joined onto cached cells — the expression rows ARE
// the plotted records (x,y,type + the gene columns), fetched per panel per
// feature.
//
// config:
//   id           unique Recoil key prefix, e.g. "scMultiRegional" ("sc…" so
//                keys can never collide with the legacy per-module atoms
//                while both coexist during the migration)
//   countsTitle  heading of the counts card, e.g. "Cell Counts"
//   defaultGene  the feature active on page load; clearing the picker shows
//                the cell-type cluster view (activeFeature: null), Reset
//                returns to this gene
//   panels       one entry per plot on the page:
//     id           panel key, used in Recoil keys and counts accessors
//     label        plot title base, e.g. "Malignant Cells"
//     countsLabel  counts-table column wording, e.g. "Malignant"
//     countsAria   aria-label prefix for the counts columns, e.g. "Tumor Cell"
//     table        cells table (x,y,type + one column per gene)
//     statsTable   per-gene stats table (gene,count,mean,percent)
//     colors       trace color array; omit for the shared default palette
//     axes         { x, y } axis titles ("t-SNE 1/2" or "UMAP 1/2")
//     initialRange { x: [lo,hi] | null, y: [lo,hi] | null } — the reset view;
//                  a null member autoranges
//     legend       { title, hint, traceOrder? } for the cell-type view
//     annotations  static layout annotations (the CD4/CD8 subtype labels)
//     layout       { col, centered?, width? } grid placement
//   tabs         null for a single row of panels, or [{ id, label, panelIds }]
//                (the T-Cell page's T-Cell / CD4+CD8 tabs)
//   countsColumns panel ids in counts-table column-group order
export function createSingleCellCohortState(config) {
  const { id } = config;

  const panels = config.panels.map((panel) => {
    // the panel's cells with type only — drives the cluster view and the
    // cell counts; never re-fetches on gene changes
    const cellsQuery = selector({
      key: `${id}.panels.${panel.id}.cellsQuery`,
      get: () =>
        query("/api/query", { table: panel.table, columns: "x,y,type" }),
    });

    // per-gene stats — source of the counts table and this panel's known-genes
    // list
    const statsQuery = selector({
      key: `${id}.panels.${panel.id}.statsQuery`,
      get: () =>
        query("/api/query", {
          table: panel.statsTable,
          columns: "gene,count,mean,percent",
        }),
    });

    const genesQuery = selector({
      key: `${id}.panels.${panel.id}.genesQuery`,
      get: ({ get }) => new Set(get(statsQuery).map((s) => s.gene)),
    });

    // Color-by-feature records for this panel. The requested genes are
    // intersected with the panel's OWN gene list first: each panel has its own
    // table, and a gene another panel knows may be absent here — the server
    // silently drops unknown columns (and 400s when none are valid), so
    // sending it would corrupt the mean or fail the panel. Returns null when
    // nothing is available (the panel falls back to the cluster view);
    // otherwise { genes, records } with a per-record __value = mean over the
    // available genes, so the caller can label a partial set ("k of n").
    const expressionQuery = selectorFamily({
      key: `${id}.panels.${panel.id}.expressionQuery`,
      get:
        (genesKey) =>
        async ({ get }) => {
          if (!genesKey) return null;
          const known = get(genesQuery);
          const genes = genesKey.split(",").filter((g) => known.has(g));
          if (!genes.length) return null;
          const rows = await query("/api/query", {
            table: panel.table,
            columns: `x,y,type,${genes.join(",")}`,
          });
          const records = rows.map((r) => {
            let sum = 0;
            for (const g of genes) sum += +r[g] || 0;
            return { ...r, __value: sum / genes.length };
          });
          return { genes, records };
        },
    });

    return { ...panel, cellsQuery, statsQuery, genesQuery, expressionQuery };
  });

  // all panels' stats in panel order — the counts table needs every panel's
  // stats at once, and hooks cannot be called in a loop over panels
  const allStatsQuery = selector({
    key: `${id}.allStatsQuery`,
    get: ({ get }) => panels.map((panel) => get(panel.statsQuery)),
  });

  // gene picker options: the union across panels (each panel intersects back
  // down to what it can actually show)
  const unionGenesQuery = selector({
    key: `${id}.unionGenesQuery`,
    get: ({ get }) => {
      const union = new Set();
      for (const panel of panels)
        for (const gene of get(panel.genesQuery)) union.add(gene);
      return [...union].sort((a, b) => a.localeCompare(b));
    },
  });

  // activeFeature: what colors the plots — { kind: "gene" | "set", label,
  // genes: [...] }, or null for the cell-type cluster view ("All genes").
  // Unlike the spatial pages the null state is reachable: it IS the cluster
  // view these pages have always opened with a gene away.
  const defaultPlotOptions = {
    size: 4,
    opacity: 0.8,
    activeFeature: {
      kind: "gene",
      label: config.defaultGene,
      genes: [config.defaultGene],
    },
    // when true, drag-zoom goes to the exact drawn rectangle instead of
    // snapping to the 1:1 aspect (allows stretch distortion)
    freeZoom: false,
  };

  const plotOptionsState = atom({
    key: `${id}.plotOptionsState`,
    default: defaultPlotOptions,
  });

  // session-only gene sets, as on the spatial pages: { id, name, genes: [] }
  const geneSetsState = atom({
    key: `${id}.geneSetsState`,
    default: [],
  });

  const tabState = config.tabs
    ? atom({ key: `${id}.tabState`, default: config.tabs[0].id })
    : null;

  return {
    config,
    panels,
    allStatsQuery,
    unionGenesQuery,
    defaultPlotOptions,
    plotOptionsState,
    geneSetsState,
    tabState,
  };
}
