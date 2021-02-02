import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useRecoilState, useRecoilValue } from 'recoil';
import Plot from 'react-plotly.js';
import groupBy from 'lodash/groupBy'

import { tCellQuery, cd4Query, cd8Query, tCellCountQuery } from './t-cell.state';

export default function TCellsPlots() {

    const tCells = useRecoilValue(tCellQuery);
    const cd4 = useRecoilValue(cd4Query);
    const cd8 = useRecoilValue(cd8Query);
    const tCellCount = useRecoilValue(tCellCountQuery);

    const defaultLayout = {
        xaxis: {
            title: 'Component 1',
            showticklabels: false,
            zeroline: false,
            scaleanchor: 'y',
        },
        yaxis: {
            title: 'Component 2',
            showticklabels: false,
            zeroline: false,
        },
        hovermode: 'closest',
    };

    function getTraces({ columns, records }, groupByColumn) {
        const xIndex = columns.indexOf('x');
        const yIndex = columns.indexOf('y');
        const groupIndex = columns.indexOf(groupByColumn);
        const groups = groupBy(records, groupIndex);

        return Object.entries(groups).map(([key, values]) => ({
            name: key,
            x: values.map(v => v[xIndex]),
            y: values.map(v => v[yIndex]),
            mode: 'markers',
            type: 'scattergl',
            hoverinfo: 'name',
            marker: { size: 4, opacity: 0.7 }
        }));
    }

    return (
        <Container className="py-4">
            <Card className="shadow">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-0">
                        T Cells
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col xl={4}>
                            <Plot
                                data={getTraces(tCells, 'type')}
                                layout={{
                                    xaxis: {
                                        title: 't-SNE 1',
                                        showticklabels: false,
                                        zeroline: false,
                                        scaleanchor: 'y',
                                    },
                                    yaxis: {
                                        title: 't-SNE 2',
                                        showticklabels: false,
                                        zeroline: false,
                                    },
                                    hovermode: 'closest',
                                    title: `T Cells (n=${tCells.records.length})`,
                                }}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                        <Col xl={4}>
                            <Plot
                                data={getTraces(cd4, 'type')}
                                layout={{
                                    ...defaultLayout,
                                    title: `CD4+ T Cells (n=${cd4.records.length})`,

                                }}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                        <Col xl={4}>
                            <Plot
                                data={getTraces(cd8, 'type')}
                                layout={{
                                    ...defaultLayout,
                                    title: `CD8+ T Cells (n=${cd8.records.length})`,

                                }}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>

                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}