import { useRecoilValue } from 'recoil';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Plot from 'react-plotly.js';
import { 
    getContinuousTrace, 
    getGroupedTraces 
} from '../../services/plot';
import {
    geneState,
    markerConfigState,
    malignantCellsQuery,
    nonmalignantCellsQuery,
    malignantCellsGeneExpressionQuery,
    nonmalignantCellsGeneExpressionQuery,
} from './gene-expression.state';

export default function GeneExpressionPlots() {
    const gene = useRecoilValue(geneState);
    const malignantCells = useRecoilValue(malignantCellsQuery);
    const nonmalignantCells = useRecoilValue(nonmalignantCellsQuery);
    const malignantCellsGeneExpression = useRecoilValue(malignantCellsGeneExpressionQuery);
    const nonmalignantCellsGeneExpression = useRecoilValue(nonmalignantCellsGeneExpressionQuery);
    const {size, opacity} = useRecoilValue(markerConfigState);

    const defaultLayout = {
        xaxis: {
            title: 't-SNE 1',
            zeroline: false,
            scaleanchor: 'y',
        },
        yaxis: {
            title: 't-SNE 2',
            zeroline: false,
        },
        legend: {
            itemsizing: 'constant',
            itemwidth: 40,
        },
        hovermode: 'closest',
    };

    return gene
        ? <>
            <Row>
                <Col xl={6}>
                    <Plot
                        data={[getContinuousTrace(malignantCellsGeneExpression, 'value', {size, opacity, showscale: true})]}
                        layout={{
                            ...defaultLayout,
                            title: `<b>Malignant Cells: ${gene} (n=${malignantCellsGeneExpression.records.length})</b>`,
                        }}
                        useResizeHandler
                        className="w-100"
                        style={{ height: '800px' }}
                    />
                </Col>
                <Col xl={6}>
                    <Plot
                        data={[getContinuousTrace(nonmalignantCellsGeneExpression, 'value', {size, opacity, showscale: true})]}
                        layout={{
                            ...defaultLayout,
                            title: `<b>Non-malignant Cells:  ${gene} (n=${nonmalignantCellsGeneExpression.records.length})</b>`,
                        }}
                        useResizeHandler
                        className="w-100"
                        style={{ height: '800px' }}
                    />
                </Col>
            </Row>
        </>
        : <>
            <Row>
                <Col xl={6}>
                    <Plot
                        data={getGroupedTraces(malignantCells, 'type', {size, opacity})}
                        layout={{
                            ...defaultLayout,
                            title: {
                                ...defaultLayout.title,
                                text: `<b>Malignant Cells (n=${malignantCells.records.length})</b>`,
                            },
                            legend: {
                                ...defaultLayout.legend,
                                title: { text: 'Case (click to toggle)', font: { size: 14 } }
                            },
                        }}
                        useResizeHandler
                        className="w-100"
                        style={{ height: '800px' }}
                        revision={1}
                    />
                </Col>
                <Col xl={6}>
                    <Plot
                        data={getGroupedTraces(nonmalignantCells, 'type', {size, opacity})}
                        layout={{
                            ...defaultLayout,
                            title: `<b>Non-malignant Cells (n=${nonmalignantCells.records.length})</b>`,
                            legend: {
                                ...defaultLayout.legend,
                                title: { text: 'Type (click to toggle)', font: { size: 14 } },
                            },
                        }}
                        useResizeHandler
                        className="w-100"
                        style={{ height: '800px' }}
                        revision={1}
                    />
                </Col>
            </Row>
        </>
}