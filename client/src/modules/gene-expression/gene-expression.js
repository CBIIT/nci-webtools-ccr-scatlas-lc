import { useRecoilState, useRecoilValue } from 'recoil';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup'
import Button from 'react-bootstrap/Button'
import Plot from 'react-plotly.js';
import groupBy from 'lodash/groupBy'
import {
    malignantCellsQuery,
    nonmalignantCellsQuery
} from './gene-expression.state';


export default function GeneExpression() {
    const malignantCells = useRecoilValue(malignantCellsQuery);
    const nonmalignantCells = useRecoilValue(nonmalignantCellsQuery);
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
                        Gene Expression
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col xl={6}>
                            <Plot
                                data={getTraces(malignantCells, 'type')}
                                layout={{
                                    ...defaultLayout,
                                    title: 'Malignant Cells',
                                    legend: {
                                        title: { text: 'Case (click to toggle)', font: { size: 14 } }
                                    },
                                }}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                        <Col xl={6}>
                            <Plot
                                data={getTraces(nonmalignantCells, 'type')}
                                layout={{
                                    ...defaultLayout,
                                    title: 'Non-malignant Cells',
                                    legend: {
                                        title: { text: 'Type (click to toggle)', font: { size: 14 } },
                                        showticklabels: false,
                                    },
                                }}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="bg-white">
                    <Row>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Cell Size</Form.Label>
                                <Form.Control type="number" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Gene</Form.Label>
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        placeholder="Gene" />
                                    <InputGroup.Append>
                                        <Button variant="outline-secondary">Clear</Button>
                                    </InputGroup.Append>
                                    <InputGroup.Append>
                                        <Button variant="primary">Search</Button>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Footer>
            </Card>
        </Container>
    );
}