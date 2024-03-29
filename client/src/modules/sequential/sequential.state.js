import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

export const tumorCellsQuery = selector({
  key: "sequential.tumorCellQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "longitudinal_tumor_cell",
      columns: "x,y,type",
    }),
});

export const tumorCellsStatsQuery = selector({
  key: "longitudinal.tumorStatsQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "longitudinal_tumor_cell_stats",
      columns: "gene,count,mean,percent",
    }),
});

export const tumorGeneExpressionQuery = selectorFamily({
  key: "longitudinal.tumorGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
          table: `longitudinal_tumor_cell`,
          columns: `x,y,type,${gene}`,
        })
      : [],
});

export const normalCellsQuery = selector({
  key: "longitudinal.normalCellQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "longitudinal_normal_cell",
      columns: "x,y,type",
    }),
});

export const normalCellsStatsQuery = selector({
  key: "longitudinal.normalStatsQuery",
  get: ({ get }) =>
    query("/api/query", {
      table: "longitudinal_normal_cell_stats",
      columns: "gene,count,mean,percent",
    }),
});

export const normalGeneExpressionQuery = selectorFamily({
  key: "longitudinal.normalGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
          table: `longitudinal_normal_cell`,
          columns: `x,y,type,${gene}`,
        })
      : [],
});

export const defaultPlotOptions = { size: 4, opacity: 0.8, gene: null };

export const plotOptionsState = atom({
  key: "longitudinal.plotOptionsState",
  default: defaultPlotOptions,
});
