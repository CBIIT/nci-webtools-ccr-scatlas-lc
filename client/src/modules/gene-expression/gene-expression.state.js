import { atom, selector } from 'recoil';
import { query } from '../../services/query';

export const malignantCellsQuery = selector({
    key: 'geneExpression.malignantCellsQuery',
    get: ({get}) => query('/api/query', {table: 'malignant_cell'}),
});

export const nonmalignantCellsQuery = selector({
    key: 'geneExpression.nonmalignantCellsQuery',
    get: ({get}) => query('/api/query', {table: 'nonmalignant_cell'}),
});

export const genesQuery = selector({
    key: 'geneExpression.genesQuery',
    get: ({get}) => query('/api/query', {table: 'gene'}),
});

export const selectedGene = atom({
    key: 'geneExpression.selectedGene',
    default: '',
});

export const malignantCellsGeneExpressionQuery = selector({
    key: 'geneExpression.malignantCellsExpressionQuery',
    get: async ({get}) => {
        const gene = get(selectedGene);
        return gene && get(genesQuery).includes(gene)
            ? await query('/api/query', {table: `malignant_cell_gene_expression_${gene}`})
            : [];
    },
});

export const nonmalignantCellsGeneExpressionQuery = selector({
    key: 'geneExpression.nonmalignantCellsExpressionQuery',
    get: async ({get}) => {
        const gene = get(selectedGene);
        return gene && get(genesQuery).includes(gene)
            ? await query('/api/query', {table: `nonmalignant_cell_gene_expression_${gene}`})
            : [];
    },
});

export const nonmalignantCellsGeneCountQuery = selector({
    key: 'geneExpression.nonmalignantCellsGeneCountQuery',
    get: async ({get}) => {
        await query('/api/query', {table: `gene_count`})
    },
})