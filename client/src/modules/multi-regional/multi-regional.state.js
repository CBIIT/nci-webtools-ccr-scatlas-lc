import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";


export const tumorCellQuery = selector({
  key: "multiregional.tumorCellQuery",
  get: ({ get }) => query("/api/query", { table: "multiregional_tumor_cell", columns: "x,y,type" }),
});


export const tumorCellStatsQuery = selector({
  key: "multiregional.tumorStatsQuery",
  get: ({ get }) => query("/api/query", { table: "multiregional_tumor_cell_stats", columns: "gene,count"}),
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


export const normalCellQuery = selector({
  key: "multiregional.normalCellQuery",
  get: ({ get }) => query("/api/query", { table: "multiregional_normal_cell", columns: "x,y,type" }),
});

export const normalCellStatsQuery = selector({
  key: "multiregional.normalStatsQuery",
  get: ({ get }) => query("/api/query", { table: "multiregional_normal_cell_stats", columns: "gene,count" }),
});

export const normalrGeneExpressionQuery = selectorFamily({
    key: "multiregional.normalGeneExpressionQuery",
    get: (gene) => async (_) =>
      gene
        ? await query("/api/query", {
          table: `multiregional_normal_cell`,
          columns: `x,y,type,${gene}`,
        })
        : [],
  });

export const plotOptionsState = atom({
  key: "tCell.plotOptionsState",
  default: { size: 4, opacity: 0.8, gene: null },
});

export const tabState = atom({
  key: "tCell.tabState",
  default: "tcell",
});
