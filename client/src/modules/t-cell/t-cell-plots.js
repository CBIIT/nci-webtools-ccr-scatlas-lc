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
import { 
    tCellQuery, 
    cd4Query, 
    cd8Query, 
    markerConfigState, 
    geneState, 
    tCellGeneExpressionQuery, 
    cd4GeneExpressionQuery, 
    cd8GeneExpressionQuery 
} from './t-cell.state';

export default function TCellsPlots() {


    const tCells = useRecoilValue(tCellQuery);
    const cd4 = useRecoilValue(cd4Query);
    const cd8 = useRecoilValue(cd8Query);
    const { size, opacity } = useRecoilValue(markerConfigState);
    const gene = useRecoilValue(geneState);

    const tCellGeneExpression = useRecoilValue(tCellGeneExpressionQuery);
    const cd4GeneExpression = useRecoilValue(cd4GeneExpressionQuery);
    const cd8GeneExpression = useRecoilValue(cd8GeneExpressionQuery);

    const defaultLayout = {
        xaxis: {
            title: 'Component 1',
            zeroline: false,
            scaleanchor: 'y',
            scaleratio: 1,
            constrain: 'domain',
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

    const defaultConfig = {
        toImageButtonOptions: {
            format: 'svg',
            filename: 'plot_export',
            height: 1000,
            width: 1000,
            scale: 1
        }
    }

    // since plots are not initially visible, we need to trigger a resize event as we enter the tab
    function handleSelect(key) {
        const event = document.createEvent('Event');
        event.initEvent('resize', true, true);
        window.dispatchEvent(event);
    }


    return gene ?
        <>
            <Tabs defaultActiveKey="tcell" id="tcellTabs" className="nav-tabs-custom" onSelect={handleSelect}>
                <Tab eventKey="tcell" title="T-Cell">
                    <Row>
                        <Col xl={12} className="d-flex justify-content-center">
                            <Plot
                                data={[getContinuousTrace(tCellGeneExpression, 'value', { size, opacity, showscale: true })]}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>T-Cells: ${gene} (n=${tCellGeneExpression.records.length})</b>`,
                                    xaxis: {
                                        title: 't-SNE 1',
                                    },
                                    yaxis: {
                                        title: 't-SNE 2',
                                    },

                                })}
                                config={defaultConfig}
                                useResizeHandler
                                className="mw-100"
                                style={{ height: '800px', width: '1000px' }}
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
                                    title: `<b>CD4+ T-Cells:  ${gene}</b>`,
                                })}
                                config={defaultConfig}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                        <Col xl={6}>
                            <Plot
                                data={[getContinuousTrace(cd8GeneExpression, 'value', { size, opacity, showscale: true })]}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>CD8+ T-Cells:  ${gene}</b>`,
                                })}
                                config={defaultConfig}
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
            <Tabs defaultActiveKey="tcell" id="tcellTabs" className="nav-tabs-custom" onSelect={handleSelect}>
                <Tab eventKey="tcell" title="T-Cell">
                    <Row>
                        <Col xl={12} className="d-flex justify-content-center">
                            <Plot
                                data={getGroupedTraces(tCells, 'type', { size, opacity })}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>T-Cells (n=${tCells.records.length})</b>`,
                                    legend: {
                                        title: {
                                            text: 'Type',
                                            font: { size: 14 },
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
                                config={defaultConfig}
                                useResizeHandler
                                className="mw-100"
                                style={{ height: '800px', width: '1000px' }}
                            />
                        </Col>
                    </Row>
                </Tab>


                <Tab eventKey="cd4/8" title="CD4/CD8">
                    <Row>
                        <Col xl={6}>
                            <Plot
                                data={getGroupedTraces(cd4, 'type', { size, opacity })}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>CD4+ T-Cells</b>`,
                                    legend: {
                                        title: {
                                            text: 'Type',
                                            font: { size: 14 },
                                        },
                                    },
                                    annotations: [
                                        {
                                            x: -11,
                                            y: 3,
                                            text: '<b>Cytotoxic</b>',
                                            showarrow: false,
                                            font: {
                                                size: 16
                                            }
                                        },
                                        {
                                            x: 4,
                                            y: 10,
                                            text: '<b>Exhausted</b>',
                                            showarrow: false,
                                            font: {
                                                size: 16
                                            }
                                        },
                                        {
                                            x: 8,
                                            y: -4,
                                            text: '<b>Naive</b>',
                                            showarrow: false,
                                            font: {
                                                size: 16
                                            }
                                        }
                                    ]
                                })}
                                config={defaultConfig}
                                useResizeHandler
                                className="w-100"
                                style={{ height: '800px' }}
                            />
                        </Col>
                        <Col xl={6}>
                            <Plot
                                data={getGroupedTraces(cd8, 'type', { size, opacity })}
                                layout={merge({}, defaultLayout, {
                                    title: `<b>CD8+ T-Cells</b>`,
                                    legend: {
                                        title: {
                                            text: 'Type',
                                            font: { size: 14 },
                                        },
                                    },
                                    annotations: [
                                        {
                                            x: -11,
                                            y: -1,
                                            text: '<b>Cytotoxic</b>',
                                            showarrow: false,
                                            font: {
                                                size: 16
                                            }
                                        },
                                        {
                                            x: 2,
                                            y: -12,
                                            text: '<b>Exhausted</b>',
                                            showarrow: false,
                                            font: {
                                                size: 16
                                            }
                                        },
                                        {
                                            x: 6,
                                            y: 5,
                                            text: '<b>Naive</b>',
                                            showarrow: false,
                                            font: {
                                                size: 16
                                            }
                                        }
                                    ]
                                })}
                                config={defaultConfig}
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