import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";


export const cd4Query = selector({
  key: "tCell.cd4Query",
  get: ({ get }) => query("/api/query", { table: "cd4_cell", columns: "x,y,type" }),
});


export const cd4StatsQuery = selector({
  key: "tCell.cd4StatsQuery",
  get: ({ get }) => query("/api/query", { table: "cd4_cell_stats", columns: "gene,count,mean"}),
});

export const cd4GeneExpressionQuery = selectorFamily({
  key: "tCell.cd4GeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
        table: `cd4_cell`,
        columns: `x,y,type,${gene}`,
      })
      : [],
});


export const cd8Query = selector({
  key: "tCell.cd8Query",
  get: ({ get }) => query("/api/query", { table: "cd8_cell", columns: "x,y,type" }),
});

export const cd8StatsQuery = selector({
  key: "tCell.cd8StatsQuery",
  get: ({ get }) => query("/api/query", { table: "cd8_cell_stats", columns: "gene,count,mean", raw: true }),
});

export const cd8GeneExpressionQuery = selectorFamily({
  key: "tCell.cd8GeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
        table: `cd8_cell`,
        columns: `x,y,type,${gene}`,
      })
      : [],
});

export const tCellQuery = selector({
  key: "tCell.tCellQuery",
  get: ({ get }) => query("/api/query", { table: "t_cell", columns: "x,y,type" }),
});

export const tCellStatsQuery = selector({
  key: "tCell.tCellStatsQuery",
  get: ({ get }) => query("/api/query", { table: "t_cell_stats", columns: "gene,count,mean", raw: true }),
});

export const tCellGeneExpressionQuery = selectorFamily({
  key: "tCell.tCellGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
        table: `t_cell`,
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
