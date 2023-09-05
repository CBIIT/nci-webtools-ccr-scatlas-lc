import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";


export const tumorCellQuery = selector({
  key: "sequential.tumorCellQuery",
  get: ({ get }) => query("/api/query", { table: "longitudinal_tumor_cell", columns: "x,y,type" }),
});


export const tumorCellsStatsQuery = selector({
  key: "longitudinal.tumorStatsQuery",
  get: ({ get }) => query("/api/query", { table: "longitudinal_tumor_cell_stats", columns: "gene,count"}),
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


export const normalCellQuery = selector({
  key: "longitudinal.normalCellQuery",
  get: ({ get }) => query("/api/query", { table: "longitudinal_normal_cell", columns: "x,y,type" }),
});

export const normalCellStatsQuery = selector({
  key: "longitudinal.normalStatsQuery",
  get: ({ get }) => query("/api/query", { table: "longitudinal_normal_cell_stats", columns: "gene,count" }),
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

export const plotOptionsState = atom({
  key: "longitudinal.plotOptionsState",
  default: { size: 4, opacity: 0.8, gene: null },
});

