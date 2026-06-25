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

// Color-by-expression: same cells, plus the chosen gene's column. Empty until a gene
// is picked (used by the gene search in a later step).
export const geneExpressionQuery = selectorFamily({
  key: "tigerlc.geneExpressionQuery",
  get: (gene) => async () =>
    gene
      ? await query("/api/query", {
          table: "tigerlc",
          columns: `x,y,type,sample,cell_id,${gene}`,
        })
      : [],
});

// samples: null = all samples selected (default); otherwise an array of sample ids
export const defaultPlotOptions = { size: 4, opacity: 0.8, gene: null, samples: null };

export const plotOptionsState = atom({
  key: "tigerlc.plotOptionsState",
  default: defaultPlotOptions,
});
