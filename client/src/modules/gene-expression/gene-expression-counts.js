import { useMemo, useCallback } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import Button from 'react-bootstrap/Button';
import Table, { TextFilter, RangeFilter } from '../components/table';
import { geneCountsQuery, geneState } from './gene-expression.state';

export default function GeneExpressionCounts() {
    const geneCounts = useRecoilValue(geneCountsQuery);
    const setGene = useSetRecoilState(geneState);
    const updateGene = useCallback(gene => {
        window.scrollTo(0, 0);
        setGene(gene);
    }, [setGene]);

    const columns = useMemo(_ => [
        {
            accessor: 'gene',
            Header: 'Gene',
            Filter: TextFilter,
            Cell: ({ value }) => (
                <Button variant="link" className="p-0" onClick={_ => updateGene(value)}>
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
    ], [updateGene]);

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