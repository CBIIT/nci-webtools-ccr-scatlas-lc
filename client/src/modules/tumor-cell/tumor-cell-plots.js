import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Plot from "react-plotly.js";
import merge from "lodash/merge";
import { getTraces } from "../../services/plot";
import {
  plotOptionsState,
  malignantCellsQuery,
  nonmalignantCellsQuery,
  malignantCellsGeneExpressionQuery,
  nonmalignantCellsGeneExpressionQuery,
} from "./tumor-cell.state";

export default function TumorCellPlots() {
  const malignantCells = useRecoilValue(malignantCellsQuery);
  const nonmalignantCells = useRecoilValue(nonmalignantCellsQuery);
  const { size, opacity, gene } = useRecoilValue(plotOptionsState);
  const malignantCellsGeneExpression = useRecoilValue(
    malignantCellsGeneExpressionQuery(gene),
  );
  const nonmalignantCellsGeneExpression = useRecoilValue(
    nonmalignantCellsGeneExpressionQuery(gene),
  );

  const defaultLayout = {
    xaxis: {
      title: "t-SNE 1",
      zeroline: false,
      scaleanchor: "y",
      scaleratio: 1,
      constrain: "domain",
    },
    yaxis: {
      title: "t-SNE 2",
      zeroline: false,
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
    valueColumn: gene && "value",
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
            data={getTraces(
              malignantCellsGeneExpression,
              traceColumns,
              traceConfig,
              gene
            )}
            layout={merge({}, defaultLayout, {
              title: `<b>Malignant Cells: ${gene} (n=${malignantCellsGeneExpression.records.length})</b>`,
            })}
            config={defaultConfig}
            useResizeHandler
            className="w-100"
            style={{ height: "800px" }}
          />
        </Col>
        <Col xl={6}>
          <Plot
            data={getTraces(
              nonmalignantCellsGeneExpression,
              traceColumns,
              traceConfig,
              gene
            )}
            layout={merge({}, defaultLayout, {
              title: `<b>Non-malignant Cells: ${gene} (n=${nonmalignantCellsGeneExpression.records.length})</b>`,
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
            data={getTraces(malignantCells, traceColumns, traceConfig, gene)}
            layout={merge({}, defaultLayout, {
              title: [
                `<b>Malignant Cells (n=${malignantCells.records.length})</b>`,
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
            data={getTraces(nonmalignantCells, traceColumns, traceConfig, gene)}
            layout={merge({}, defaultLayout, {
              title: [
                `<b>Non-malignant Cells (n=${nonmalignantCells.records.length})</b>`,
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
