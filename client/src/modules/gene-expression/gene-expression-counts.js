import { useMemo } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import Button from 'react-bootstrap/Button';
import { Table, TextFilter, RangeFilter } from '../components/table';
import { geneCountsQuery, geneState } from './gene-expression.state';

export default function GeneExpressionCounts() {
    const geneCounts = useRecoilValue(geneCountsQuery);
    const [gene, setGene] = useRecoilState(geneState);

    function updateGene(gene) {
        window.scrollTo(0, 0);
        setGene(gene);
    }

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
            placeholder: 'Search Genes',
        },
        {
            Header: 'Cells Expressing',
            accessor: 'malignant_cell_count',
            Filter: RangeFilter,
            filter: 'between',
        }
    ], []);

    const data = useMemo(_ =>
        geneCounts.records,
        [geneCounts]
    );

    const sortBy = [
        { id: 'malignant_cell_count', desc: true }
    ];

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