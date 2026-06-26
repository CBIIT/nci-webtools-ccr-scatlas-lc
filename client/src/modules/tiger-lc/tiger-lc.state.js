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

// Color-by-feature: a "feature" is one or more genes (a single gene, or a gene set).
// Fetch the feature's gene columns and add a per-cell `__value` = mean across them
// (mean of one gene = that gene's value). Keyed by a comma-joined gene list so Recoil
// caches per feature. Empty list -> no rows.
export const featureExpressionQuery = selectorFamily({
  key: "tigerlc.featureExpressionQuery",
  get: (genesKey) => async () => {
    if (!genesKey) return [];
    const genes = genesKey.split(",");
    const rows = await query("/api/query", {
      table: "tigerlc",
      columns: `x,y,type,sample,cell_id,${genes.join(",")}`,
    });
    return rows.map((r) => {
      let sum = 0;
      for (const g of genes) sum += +r[g] || 0;
      return { ...r, __value: sum / genes.length };
    });
  },
});

// activeFeature: what colors the plot — null (color by cell type) or
// { kind: "gene" | "set", label, genes: [...] }. A single gene is a 1-gene feature.
// samples: null = all samples selected (default); otherwise an array of sample ids.
export const defaultPlotOptions = {
  size: 4,
  opacity: 0.8,
  activeFeature: null,
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
