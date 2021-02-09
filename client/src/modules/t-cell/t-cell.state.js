import { atom, selector, selectorFamily } from 'recoil';
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

export const lookupQuery = selector({
    key: 'tCell.lookupQuery',
    get: async ({get}) => await query('/api/lookup'),
});

export const tCellGeneExpressionQuery = selectorFamily({
    key: 'tCell.tCellGeneExpressionQuery',
    get: gene => async _ => gene
        ? await query('/api/query', {table: `v_t_cell_gene_expression_${gene}`, raw: true}) 
        : [],
});

export const cd4GeneExpressionQuery = selectorFamily({
    key: 'tCell.cd4GeneExpressionQuery',
    get: gene => async _ => gene
        ? await query('/api/query', {table: `v_cd4_cell_gene_expression_${gene}`, raw: true}) 
        : [],
});

export const cd8GeneExpressionQuery = selectorFamily({
    key: 'tCell.cd8GeneExpressionQuery',
    get: gene => async _ => gene
        ? await query('/api/query', {table: `v_cd8_cell_gene_expression_${gene}`, raw: true}) 
        : [],
});
export const geneState = atom({
    key: 'tCell.geneState',
    default: '',
});

export const plotOptionsState = atom({
    key: 'tCell.plotOptionsState',
    default: { size: 4, opacity: 0.8, gene: null },
});

export const tabState = atom({
    key: 'tCell.tabState',
    default: 'tcell'
})