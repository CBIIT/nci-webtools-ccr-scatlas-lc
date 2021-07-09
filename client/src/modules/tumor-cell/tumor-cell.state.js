import { atom, selector, selectorFamily } from "recoil";
import { query } from "../../services/query";

export const malignantCellsQuery = selector({
  key: "tumorCell.malignantCellsQuery",
  get: ({ get }) => query("/api/query", { table: "malignant_cell", raw: true }),
});

export const nonmalignantCellsQuery = selector({
  key: "tumorCell.nonmalignantCellsQuery",
  get: ({ get }) =>
    query("/api/query", { table: "nonmalignant_cell", raw: true }),
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

export const lookupQuery = selector({
  key: "tumorCell.lookupQuery",
  get: async ({ get }) => await query("/api/lookup"),
});

export const plotOptionsState = atom({
  key: "tumorCell.plotOptions",
  default: { size: 4, opacity: 0.8, gene: null },
});

export const malignantCellsGeneExpressionQuery = selectorFamily({
  key: "tumorCell.malignantCellsGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
          table: `v_malignant_cell_gene_expression_${gene}`,
          raw: true,
        })
      : [],
});

export const nonmalignantCellsGeneExpressionQuery = selectorFamily({
  key: "tumorCell.nonmalignantCellsGeneExpressionQuery",
  get: (gene) => async (_) =>
    gene
      ? await query("/api/query", {
          table: `v_nonmalignant_cell_gene_expression_${gene}`,
          raw: true,
        })
      : [],
});
