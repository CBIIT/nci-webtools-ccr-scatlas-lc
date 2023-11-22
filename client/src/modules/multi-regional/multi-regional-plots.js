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
} from "./multi-regional.state";

export default function MultiRegionalCellPlots() {
  const tumorCells = useRecoilValue(tumorCellsQuery);
  const normalCells = useRecoilValue(normalCellsQuery);
  const { size, opacity, gene } = useRecoilValue(plotOptionsState);
  const tumorGeneExpression = useRecoilValue(tumorGeneExpressionQuery(gene));
  const normalGeneExpression = useRecoilValue(normalGeneExpressionQuery(gene));

  const tumorCellColors = [
    "#FFD700",
    "#FF8C00",
    "#8B5A00",
    "#ADFF2F",
    "#32CD32",
    "#00868B",
    "#D3D3D3",
    "#7A7A7A",
    "#00EEEE",
    "#B0C4DE",
    "#3A5FCD",
    "#FFC0CB",
    "#CD919E",
    "#EEAEEE",
    "#FF00FF",
    "#AB82FF",
    "#551A8B",
  ];

  const normalCellColors = [
    "#4682B4",
    "#FF7F24",
    "#8B4513",
    "#ED82B4",
    "#228B22",
    "#F7EC37",
    "#EE2C2C",
  ];

  const defaultLayout = {
    xaxis: {
      title: "t-SNE 1",
      zeroline: false,
      scaleanchor: "y",
      scaleratio: 1,
      constrain: "domain",
      range: [-45, 45],
    },
    yaxis: {
      title: "t-SNE 2",
      zeroline: false,
      range: [-40, 40],
    },
    legend: {
      itemsizing: "constant",
      itemwidth: 40,
      traceOrder: "reverse",
    },
    hovermode: "closest",
    uirevision: gene || 1,
  };
  const defaultLayoutNonMalignant = {
    xaxis: {
      title: "UMAP 1",
      zeroline: false,
      scaleanchor: "y",
      scaleratio: 1,
      constrain: "domain",
      range: [-20, 10],
    },
    yaxis: {
      title: "UMAP 2",
      zeroline: false,
      range: [-15, 20],
    },
    legend: {
      itemsizing: "constant",
      itemwidth: 40,
      traceOrder: "reverse",
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
            layout={merge({}, defaultLayoutNonMalignant, {
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
            data={getTraces(tumorCells, traceConfig, gene, tumorCellColors)}
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
            layout={merge({}, defaultLayoutNonMalignant, {
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
