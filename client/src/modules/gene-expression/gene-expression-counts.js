
import { useRecoilValue } from 'recoil';
import BootstrapTable from 'react-bootstrap-table-next';
// import filterFactory, { numberFilter, textFilter } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import { geneCountsQuery } from './gene-expression.state';

export default function GeneExpressionCounts() {
    const geneCounts = useRecoilValue(geneCountsQuery);

    const columns = [
        {
            dataField: 'gene',
            text: 'Gene',
            sort: true,
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