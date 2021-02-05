import { atom, selector } from 'recoil';
import { query } from '../../services/query';

export const malignantCellsQuery = selector({
    key: 'tumorCell.malignantCellsQuery',
    get: ({get}) => query('/api/query', {table: 'malignant_cell', raw: true}),
});

export const nonmalignantCellsQuery = selector({
    key: 'tumorCell.nonmalignantCellsQuery',
    get: ({get}) => query('/api/query', {table: 'nonmalignant_cell', raw: true}),
});

export const geneCountsQuery = selector({
    key: 'tumorCell.geneCountsQuery',
    get: async ({get}) => await query('/api/query', {table: `v_malignant_nonmalignant_cell_gene_count`, orderBy: 'malignant_cell_count', order: 'desc'}),
});

export const geneState = atom({
    key: 'tumorCell.geneState',
    default: '',
});

export const markerConfigState = atom({
    key: 'tumorCell.markerConfigState',
    default: { size: 4, opacity: 0.8 },
});

export const malignantCellsGeneExpressionQuery = selector({
    key: 'tumorCell.malignantCellsGeneExpressionQuer',
    get: async ({get}) => get(geneState) 
        ? await query('/api/query', {table: `v_malignant_cell_gene_expression_${get(geneState)}`, raw: true}) 
        : [],
});

export const nonmalignantCellsGeneExpressionQuery = selector({
    key: 'tumorCell.nonmalignantCellsGeneExpressionQuery',
    get: async ({get}) => get(geneState) 
        ? await query('/api/query', {table: `v_nonmalignant_cell_gene_expression_${get(geneState)}`, raw: true}) 
        : [],
});