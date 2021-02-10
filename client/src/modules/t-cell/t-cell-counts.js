import { useMemo, useCallback } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import Button from 'react-bootstrap/Button';
import Table, { TextFilter, RangeFilter } from '../components/table';
import { tCellCountQuery, plotOptionsState } from './t-cell.state';

export default function TCellCounts() {
    const geneCounts = useRecoilValue(tCellCountQuery);
    const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
    const setGene = useCallback(gene => {
        window.scrollTo(0, 0);
        setPlotOptions({...plotOptions, gene});
    }, [plotOptions, setPlotOptions]);

    const columns = useMemo(_ => [
        {
            accessor: 'gene',
            Header: 'Gene',
            Filter: TextFilter,
            Cell: ({ value }) => (
                <Button variant="link" className="p-0" onClick={_ => setGene(value)}>
                    {value}
                </Button>
            ),
            placeholder: 'Enter gene',
            aria: 'T Cell Gene'
        },
        {
            Header: 'T Cells Expressing',
            accessor: 't_cell_count',
            Filter: RangeFilter,
            filter: 'between',
            minPlaceholder: 'Enter min value',
            maxPlaceholder: 'Enter max value',
            aria: 'T Cell Expressing'
        },
        {
            Header: 'CD4+ T Cells Expressing',
            accessor: 'cd4_cell_count',
            Filter: RangeFilter,
            filter: 'between',
            minPlaceholder: 'Enter min value',
            maxPlaceholder: 'Enter max value',
            aria: 'CD4+ Expressing'
        },
        {
            Header: 'CD8+ T Cells Expressing',
            accessor: 'cd8_cell_count',
            Filter: RangeFilter,
            filter: 'between',
            minPlaceholder: 'Enter min value',
            maxPlaceholder: 'Enter max value',
            aria: 'CD8+ Expressing'
        }
    ], [setGene]);

    const data = useMemo(_ =>
        geneCounts.records,
        [geneCounts]
    );

    const sortBy = useMemo(_ => [
        { id: 't_cell_count', desc: true }
    ], []);

    const options = {
        initialState: { sortBy },
        defaultCanSort: true,
    };

    return (
        <Table 
            columns={columns} 
            data={data} 
            options={options} 
        />
    );
}