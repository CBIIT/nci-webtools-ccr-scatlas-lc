
import { useRecoilValue, useRecoilState } from 'recoil';
import BootstrapTable from 'react-bootstrap-table-next';
import Button from 'react-bootstrap/Button';
// import filterFactory, { numberFilter, textFilter } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import { 
    geneCountsQuery,
    geneState,
} from './gene-expression.state';

export default function GeneExpressionCounts() {
    const geneCounts = useRecoilValue(geneCountsQuery);
    const [gene, setGene] = useRecoilState(geneState);

    function updateGene(gene) {
        window.scrollTo(0, 0);
        setGene(gene);
    }

    const columns = [
        {
            dataField: 'gene',
            text: 'Gene',
            sort: true,
            formatter: cell => <Button variant="link" className="p-0" onClick={_ => updateGene(cell)}>{cell}</Button>
        },
        {
            dataField: 'malignant_cell_count',
            text: 'Cells',
            sort: true,
        },
    ];

    return (
        <BootstrapTable
            bootstrap4
            hover
            bordered
            keyField="id"
            data={geneCounts.records}
            columns={columns}
            defaultSorted={[{
                dataField: 'malignant_cell_count',
                order: 'desc'
            }]}
            pagination={paginationFactory({
                showTotal: true
            })}
            filterPosition="top"
        />
    )



}