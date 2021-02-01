import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useRecoilState, useRecoilValue } from 'recoil';
import Plot from 'react-plotly.js';
import groupBy from 'lodash/groupBy'

import { tCellQuery } from './t-cell.state';

export default function TCells() {

    const tCells = useRecoilValue(tCellQuery);

    const defaultLayout = {
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
                                    ...defaultLayout,
                                    title: 'T Cells',
                                    legend: {
                                        title: { text: 'Case (click to toggle)', font: { size: 14 } }
                                    },
                                }}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            /> 
                        </Col>
                        <Col xl={4}>
                            Plot 2
                        </Col>
                        <Col xl={4}>
                            Plot 3
                        </Col>

                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}