import { useMemo, useCallback } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import Button from 'react-bootstrap/Button';
import Table, { TextFilter, RangeFilter } from '../components/table';
import { geneCountsQuery, plotOptionsState } from './tumor-cell.state';

export default function TumorCellCounts() {
    const geneCounts = useRecoilValue(geneCountsQuery);
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
        },
        {
            Header: 'Cells Expressing',
            accessor: 'malignant_cell_count',
            Filter: RangeFilter,
            filter: 'between',
            minPlaceholder: 'Enter min value',
            maxPlaceholder: 'Enter max value',
        }
    ], [setGene]);

    const data = useMemo(_ =>
        geneCounts.records,
        [geneCounts]
    );

    const sortBy = useMemo(_ => [
        { id: 'malignant_cell_count', desc: true }
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