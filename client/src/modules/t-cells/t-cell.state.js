import { atom, selector } from 'recoil';
import { query } from '../../services/query';

export const tCellQuery = selector({
    key: 'tCell.tCellQuery',
    get: ({get}) => query('/api/query', {table: 't_cell'}),
});