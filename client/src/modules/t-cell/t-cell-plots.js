import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useRecoilState, useRecoilValue } from 'recoil';
import Plot from 'react-plotly.js';
import groupBy from 'lodash/groupBy'

import {
    getContinuousTrace,
    getGroupedTraces
} from '../../services/plot';

import { tCellQuery, cd4Query, cd8Query, markerConfigState, tCellState, tCellGeneExpressionQuery, cd4GeneExpressionQuery, cd8GeneExpressionQuery } from './t-cell.state';

export default function TCellsPlots() {


    const tCells = useRecoilValue(tCellQuery);
    const cd4 = useRecoilValue(cd4Query);
    const cd8 = useRecoilValue(cd8Query);
    const { size, opacity } = useRecoilValue(markerConfigState);
    const gene = useRecoilValue(tCellState);

    const tCellGeneExpression = useRecoilValue(tCellGeneExpressionQuery);
    const cd4GeneExpression = useRecoilValue(cd4GeneExpressionQuery);
    const cd8GeneExpression = useRecoilValue(cd8GeneExpressionQuery);

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


    return gene ?
        <>
            <Row>
                <Col xl={4}>
                    <Plot
                        data={[getContinuousTrace(tCellGeneExpression, 'value', { size, opacity, showscale: true })]}
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
                            title: `T Cells: ${gene} (n=${tCellGeneExpression.records.length})`,
                        }}
                        useResizeHandler
                        className="w-100"
                        style={{ height: '800px' }}
                    />
                </Col>
                <Col xl={4}>
                    <Plot
                        data={[getContinuousTrace(cd4GeneExpression, 'value', { size, opacity, showscale: true })]}
                        layout={{
                            ...defaultLayout,
                            title: `CD4+ T Cells:  ${gene} (n=${cd4GeneExpression.records.length})`,
                        }}
                        useResizeHandler
                        className="w-100"
                        style={{ height: '800px' }}
                    />
                </Col>
                <Col xl={4}>
                <Plot
                        data={[getContinuousTrace(cd8GeneExpression, 'value', { size, opacity, showscale: true })]}
                        layout={{
                            ...defaultLayout,
                            title: `CD8+ T Cells:  ${gene} (n=${cd8GeneExpression.records.length})`,
                        }}
                        useResizeHandler
                        className="w-100"
                        style={{ height: '800px' }}
                    />
                </Col>
            </Row>
        </>
        :
        <>
            <Row>
                <Col xl={4}>
                    <Plot
                        data={getGroupedTraces(tCells, 'type', { size, opacity })}
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
                        data={getGroupedTraces(cd4, 'type', { size, opacity })}
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
                        data={getGroupedTraces(cd8, 'type', { size, opacity })}
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
        </>
}