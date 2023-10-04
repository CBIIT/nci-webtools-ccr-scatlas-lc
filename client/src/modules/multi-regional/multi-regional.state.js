import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

export const tumorCellsQuery = selector({
  key: "multiregional.tumorCellQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "multiregional_tumor_cell",
      columns: "x,y,type",
    }),
});

export const tumorCellsStatsQuery = selector({
  key: "multiregional.tumorStatsQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "multiregional_tumor_cell_stats",
      columns: "gene,count,mean",
    }),
});

export const tumorGeneExpressionQuery = selectorFamily({
  key: "multiregional.tumorGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
          table: `multiregional_tumor_cell`,
          columns: `x,y,type,${gene}`,
        })
      : [],
});

export const normalCellsQuery = selector({
  key: "multiregional.normalCellQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "multiregional_normal_cell",
      columns: "x,y,type",
    }),
});

export const normalCellsStatsQuery = selector({
  key: "multiregional.normalStatsQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "multiregional_normal_cell_stats",
      columns: "gene,count,mean",
    }),
});

export const normalGeneExpressionQuery = selectorFamily({
  key: "multiregional.normalGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
          table: `multiregional_normal_cell`,
          columns: `x,y,type,${gene}`,
        })
      : [],
});

export const defaultPlotOptions = { size: 4, opacity: 0.8, gene: null };

export const plotOptionsState = atom({
  key: "multiregional.plotOptionsState",
  default: defaultPlotOptions,
});
