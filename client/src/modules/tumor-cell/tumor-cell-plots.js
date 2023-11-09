import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Plot from "react-plotly.js";
import merge from "lodash/merge";
import { getTraces } from "../../services/plot";
import {
  plotOptionsState,
  tumorCellsQuery,
  normalCellsQuery,
  tumorGeneExpressionQuery,
  normalGeneExpressionQuery,
} from "./tumor-cell.state";

export default function TumorCellPlots() {
  const tumorCells = useRecoilValue(tumorCellsQuery);
  const normalCells = useRecoilValue(normalCellsQuery);
  const { size, opacity, gene } = useRecoilValue(plotOptionsState);
  const tumorGeneExpression = useRecoilValue(tumorGeneExpressionQuery(gene));
  const normalGeneExpression = useRecoilValue(normalGeneExpressionQuery(gene));

  const normalCellColors = [
    "#4682B4",
    "#FF7F24",
    "#8B4513",
    "#ED82B4",
    "#F7EC37",
    "#EE2C2C",
    "#228B22",
  ];

  const defaultLayout = {
    xaxis: {
      title: "t-SNE 1",
      zeroline: false,
      scaleanchor: "y",
      scaleratio: 1,
      constrain: "domain",
      range: [-100, 100],
    },
    yaxis: {
      title: "t-SNE 2",
      zeroline: false,
      range: [-100, 100],
    },
    legend: {
      itemsizing: "constant",
      itemwidth: 40,
    },
    hovermode: "closest",
    uirevision: gene || 1,
  };

  const defaultConfig = {
    displayModeBar: true,
    toImageButtonOptions: {
      format: "svg",
      filename: "plot_export",
      height: 1000,
      width: 1000,
      scale: 1,
    },
    displaylogo: false,
    modeBarButtonsToRemove: [
      "select2d",
      "lasso2d",
      "hoverCompareCartesian",
      "hoverClosestCartesian",
    ],
  };

  const traceColumns = {
    groupColumn: "type",
    valueColumn: gene,
  };

  const traceConfig = {
    showlegend: !gene,
    hoverinfo: !gene ? "name" : "text+name",
    hoverlabel: {
      namelength: -1,
    },
    marker: {
      size,
      opacity,
      colorbar: {
        thickness: 20,
      },
      ...(!gene && {
        showscale: false,
      }),
    },
  };

  return gene ? (
    <>
      <Row>
        <Col xl={6}>
          <Plot
            data={getTraces(tumorGeneExpression, traceConfig, gene)}
            layout={merge({}, defaultLayout, {
              title: `<b>Malignant Cells: ${gene} (n=${tumorGeneExpression.length})</b>`,
            })}
            config={defaultConfig}
            useResizeHandler
            className="w-100"
            style={{ height: "800px" }}
          />
        </Col>
        <Col xl={6}>
          <Plot
            data={getTraces(normalGeneExpression, traceConfig, gene)}
            layout={merge({}, defaultLayout, {
              title: `<b>Non-malignant Cells: ${gene} (n=${normalGeneExpression.length})</b>`,
            })}
            config={defaultConfig}
            useResizeHandler
            className="w-100"
            style={{ height: "800px" }}
          />
        </Col>
      </Row>
    </>
  ) : (
    <>
      <Row>
        <Col xl={6}>
          <Plot
            data={getTraces(tumorCells, traceConfig, gene)}
            layout={merge({}, defaultLayout, {
              title: [
                `<b>Malignant Cells (n=${tumorCells.length})</b>`,
                `<span style="font-size: 12px; color: grey;">Click legend to show/hide cases</span>`,
              ].join("<br>"),
              legend: {
                title: { text: "Case", font: { size: 14 } },
              },
            })}
            config={defaultConfig}
            useResizeHandler
            className="w-100"
            style={{ height: "800px" }}
          />
        </Col>
        <Col xl={6}>
          <Plot
            data={getTraces(normalCells, traceConfig, gene, normalCellColors)}
            layout={merge({}, defaultLayout, {
              title: [
                `<b>Non-malignant Cells (n=${normalCells.length})</b>`,
                '<span style="font-size: 12px; color: grey; ">Click legend to show/hide types</span>',
              ].join("<br>"),
              legend: {
                title: { text: "Type", font: { size: 14 } },
              },
            })}
            config={defaultConfig}
            useResizeHandler
            className="w-100"
            style={{ height: "800px" }}
          />
        </Col>
      </Row>
    </>
  );
}
