import { atom, selector } from 'recoil';
import { query } from '../../services/query';

export const tCellQuery = selector({
    key: 'tCell.tCellQuery',
    get: ({get}) => query('/api/query', {table: 't_cell', raw: true}),
});

export const cd4Query = selector({
    key: 'tCell.cd4Query',
    get: ({get}) => query('/api/query', {table: 'cd4_cell', raw: true}),
});

export const cd8Query = selector({
    key: 'tCell.cd8Query',
    get: ({get}) => query('/api/query', {table: 'cd8_cell', raw: true}),
});

export const tCellCountQuery = selector({
    key: 'tCell.tCellCountQuery',
    get: async ({get}) => await query('/api/query', {table: `v_t_cd4_cd8_cell_gene_count`, orderBy: 't_cell_count', order: 'desc'}),
});

export const tCellGeneExpressionQuery = selector({
    key: 'tCell.tCellGeneExpressionQuery',
    get: async ({get}) => get(tCellState) 
        ? await query('/api/query', {table: `v_t_cell_gene_expression_${get(tCellState)}`, raw: true}) 
        : [],
});

export const cd4GeneExpressionQuery = selector({
    key: 'tCell.cd4GeneExpressionQuery',
    get: async ({get}) => get(tCellState) 
        ? await query('/api/query', {table: `v_cd4_cell_gene_expression_${get(tCellState)}`, raw: true}) 
        : [],
});

export const cd8GeneExpressionQuery = selector({
    key: 'tCell.cd8GeneExpressionQuery',
    get: async ({get}) => get(tCellState) 
        ? await query('/api/query', {table: `v_cd8_cell_gene_expression_${get(tCellState)}`, raw: true}) 
        : [],
});
export const tCellState = atom({
    key: 'tCell.tCellState',
    default: '',
});

export const markerConfigState = atom({
    key: 'tCell.markerConfigState',
    default: { size: 4, opacity: 0.7 },
});