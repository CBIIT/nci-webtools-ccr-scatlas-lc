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
    get: async ({get}) => {
        await query('/api/query', {table: `t_cell_gene_count`})
    },
})