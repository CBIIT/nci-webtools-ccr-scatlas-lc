import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import { useRecoilValue } from 'recoil';
import Plot from 'react-plotly.js';
import merge from 'lodash/merge';

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
            zeroline: false,
            scaleanchor: 'y',
        },
        yaxis: {
            title: 'Component 2',
            zeroline: false,
        },
        legend: {
            itemsizing: 'constant',
            itemwidth: 40,
        },
        hovermode: 'closest'
    };

    const sortData = (data) => {
        return (data.sort(function (a, b) {

            var first = a.name
            var second = b.name

            return first.localeCompare(second)
        }))


    }

    return gene ?
        <>
            <Tabs defaultActiveKey="tcell" id="tcellTabs">
                <Tab eventKey="tcell" title="T Cell">
                    <Row>
                        <Col xl={12}>
                            <Plot
                                data={[getContinuousTrace(tCellGeneExpression, 'value', { size, opacity, showscale: true })]}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>T Cells: ${gene} (n=${tCellGeneExpression.records.length})</b>`,
                                    xaxis: {
                                        title: 't-SNE 1',
                                    },
                                    yaxis: {
                                        title: 't-SNE 2',
                                    },

                                })}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                    </Row>
                </Tab>

                <Tab eventKey="cd4/8" title="CD4/CD8">
                    <Row>
                        <Col xl={6}>
                            <Plot
                                data={[getContinuousTrace(cd4GeneExpression, 'value', { size, opacity, showscale: true })]}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>CD4+ T Cells:  ${gene}</b>`,
                                })}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                        <Col xl={6}>
                            <Plot
                                data={[getContinuousTrace(cd8GeneExpression, 'value', { size, opacity, showscale: true })]}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>CD8+ T Cells:  ${gene}</b>`,
                                })}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                    </Row>
                </Tab>
            </Tabs>

        </>
        :
        <>
            <Tabs defaultActiveKey="tcell" id="tcellTabs">
                <Tab eventKey="tcell" title="T Cell">
                    <Row>
                        <Col xl={12}>
                            <Plot
                                data={sortData(getGroupedTraces(tCells, 'type', { size, opacity }))}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>T Cells (n=${tCells.records.length})</b>`,
                                    legend: {
                                        title: {
                                            text: 'Type (click to toggle)',
                                            font: { size: 14 },
                                            side: 'top',
                                        },
                                    },
                                    xaxis: {
                                        title: 't-SNE 1',
                                    },
                                    yaxis: {
                                        title: 't-SNE 2',
                                    },
                                    hovermode: 'closest',
                                })}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                    </Row>
                </Tab>


                <Tab eventKey="cd4/8" title="CD4/CD8">
                    <Row>
                        <Col xl={6}>
                            <Plot
                                data={sortData(getGroupedTraces(cd4, 'type', { size, opacity }))}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>CD4+ T Cells</b>`,
                                    legend: {
                                        ...defaultLayout.legend,
                                        title: {
                                            text: 'Type (click to toggle)',
                                            font: { size: 14 },
                                            side: 'top',
                                        },
                                    },
                                })}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                        <Col xl={6}>
                            <Plot
                                data={sortData(getGroupedTraces(cd8, 'type', { size, opacity }))}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>CD8+ T Cells</b>`,
                                    legend: {
                                        title: {
                                            text: 'Type (click to toggle)',
                                            font: { size: 14 },
                                            side: 'top',
                                        },
                                    },
                                })}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                    </Row>

                </Tab>
            </Tabs>

        </>
}