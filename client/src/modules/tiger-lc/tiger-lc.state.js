import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

// Spatial TIGER-LC cohort state. The cells table carries real slide-mm coordinates
// (x, y), the cell type, the sample id, and the cell id; plus one column per gene.
export const cellsQuery = selector({
  key: "tigerlc.cellsQuery",
  get: () =>
    query("/api/query", {
      table: "tigerlc",
      columns: "x,y,type,sample,cell_id",
    }),
});

export const cellsStatsQuery = selector({
  key: "tigerlc.cellsStatsQuery",
  get: () =>
    query("/api/query", {
      table: "tigerlc_stats",
      columns: "gene,count,mean,percent",
    }),
});

// The client-provided per-cell-type statistics table (verbatim from
// stats_table_tigerlc.csv): Feature + MeanExpression_<type> +
// PercentageExpression_<type> for Malignant/Immune/Stromal/Epithelial.
// Display source for the statistics table below the plots.
export const statsTableQuery = selector({
  key: "tigerlc.statsTableQuery",
  get: () =>
    query("/api/query", {
      table: "tigerlc_stats_table",
      columns:
        "Feature,MeanExpression_Malignant,MeanExpression_Immune,MeanExpression_Stromal,MeanExpression_Epithelial,PercentageExpression_Malignant,PercentageExpression_Immune,PercentageExpression_Stromal,PercentageExpression_Epithelial",
    }),
});

// Color-by-feature: a "feature" is one or more genes (a single gene, or a gene set).
// Fetches ONLY the feature's gene columns (keyed by cell_id) and joins them onto
// the already-cached cells, so the base records (coords/types/samples) never
// re-download when the gene selection changes (NCIATWP-11134). Adds a per-cell
// `__value` = mean across the genes (mean of one = that gene's value). Keyed by
// a comma-joined gene list so Recoil caches per feature. Empty list -> no rows.
export const featureExpressionQuery = selectorFamily({
  key: "tigerlc.featureExpressionQuery",
  get:
    (genesKey) =>
    async ({ get }) => {
      if (!genesKey) return [];
      const cells = get(cellsQuery);
      const genes = genesKey.split(",");
      const rows = await query("/api/query", {
        table: "tigerlc",
        columns: `cell_id,${genes.join(",")}`,
      });
      const values = new Map();
      for (const r of rows) {
        let sum = 0;
        for (const g of genes) sum += +r[g] || 0;
        values.set(r.cell_id, sum / genes.length);
      }
      return cells.map((c) => ({ ...c, __value: values.get(c.cell_id) ?? 0 }));
    },
});

// activeFeature: what colors the expression (right) plots —
// { kind: "gene" | "set", label, genes: [...] }. A single gene is a 1-gene
// feature; a set may carry a toggled subset (genes ⊆ the set, setSize = full
// size). Per the reopened AC, EPCAM is the default selected gene and clearing
// a selection snaps back to it — activeFeature is never null in practice.
// samples: null = all samples selected (default); otherwise an array of sample ids.
export const defaultPlotOptions = {
  size: 4,
  opacity: 0.8,
  activeFeature: { kind: "gene", label: "EPCAM", genes: ["EPCAM"] },
  samples: null,
};

export const plotOptionsState = atom({
  key: "tigerlc.plotOptionsState",
  default: defaultPlotOptions,
});

// Gene sets are session-only (in-memory Recoil): an array of { id, name, genes: [] }.
// They survive in-app navigation but are lost on a full refresh (same as the
// cellxgene reference). No caps on sets or genes. Coloring the plot by a set's mean
// expression and member editing are wired through `activeFeature` in later steps.
export const geneSetsState = atom({
  key: "tigerlc.geneSetsState",
  default: [],
});
