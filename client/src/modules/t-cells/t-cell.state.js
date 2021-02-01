import { atom, selector } from 'recoil';
import { query } from '../../services/query';

export const tCellQuery = selector({
    key: 'tCell.tCellQuery',
    get: ({get}) => query('/api/query', {table: 't_cell'}),
});

export const tCellCountQuery = selector({
    key: 'tCell.tCellCountQuery',
    get: async ({get}) => {
        await query('/api/query', {table: `t_cell_gene_count`})
    },
})