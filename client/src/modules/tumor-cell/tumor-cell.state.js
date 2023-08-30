import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

export const tumorCellsQuery = selector({
  key: "tumorCell.tumorCellsQuery",
  get: ({ get }) => query("/api/query", { table: "tumor_cell", columns: "x,y,type" }),
});

export const tumorCellsStatsQuery = selector({
  key: "tumorCell.tumorStatsQuery",
  get: ({ get }) => query("/api/query", { table: "tumor_cell_stats", columns: "gene,count"}),
});

export const tumorGeneExpressionQuery = selectorFamily({
  key: "tumorCell.tumorGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
        table: `tumor_cell`,
        columns: `x,y,type,${gene}`,
      })
      : [],
});

export const normalCellsQuery = selector({
  key: "tumorCell.normalCellsQuery",
  get: ({ get }) =>
    query("/api/query", { table: "normal_cell", columns: "x,y,type" }),
});

export const normalCellsStatsQuery = selector({
  key: "tumorCell.normalStatsQuery",
  get: ({ get }) => query("/api/query", { table: "normal_cell_stats", columns: "gene,count"}),
});

export const normalGeneExpressionQuery = selectorFamily({
  key: "tumorCell.normalGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
        table: `normal_cell`,
        columns: `x,y,type,${gene}`,
      })
      : [],
});

export const geneCountsQuery = selector({
  key: "tumorCell.geneCountsQuery",
  get: async ({ get }) =>
    await query("/api/query", {
      table: `v_malignant_nonmalignant_cell_gene_count`,
      orderBy: "malignant_cell_count",
      order: "desc",
    }),
});

export const plotOptionsState = atom({
  key: "tumorCell.plotOptions",
  default: { size: 4, opacity: 0.8, gene: null },
});

