import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import { useRecoilValue, useRecoilState } from "recoil";
import Plot from "react-plotly.js";
import merge from "lodash/merge";
import { getTraces } from "../../services/plot";
import {
  tCellQuery,
  cd4Query,
  cd8Query,
  plotOptionsState,
  tabState,
  tCellGeneExpressionQuery,
  cd4GeneExpressionQuery,
  cd8GeneExpressionQuery,
} from "./t-cell.state";

export default function TCellsPlots() {
  const tCells = useRecoilValue(tCellQuery);
  const cd4 = useRecoilValue(cd4Query);
  const cd8 = useRecoilValue(cd8Query);
  const { size, opacity, gene } = useRecoilValue(plotOptionsState);
  const [tab, setTab] = useRecoilState(tabState);

  const tCellGeneExpression = useRecoilValue(tCellGeneExpressionQuery(gene));
  const cd4GeneExpression = useRecoilValue(cd4GeneExpressionQuery(gene));
  const cd8GeneExpression = useRecoilValue(cd8GeneExpressionQuery(gene));

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
        color: false,
        showscale: false,
      }),
    },
  };

  const cd4Annotations = [
    {
      x: -11,
      y: 3,
      text: "<b>Cytotoxic</b>",
      showarrow: false,
      font: {
        size: 16,
      },
    },
    {
      x: 4,
      y: 10,
      text: "<b>Exhausted</b>",
      showarrow: false,
      font: {
        size: 16,
      },
    },
    {
      x: 8,
      y: -4,
      text: "<b>Naive</b>",
      showarrow: false,
      font: {
        size: 16,
      },
    },
  ];

  const cd8Annotations = [
    {
      x: -11,
      y: -1,
      text: "<b>Cytotoxic</b>",
      showarrow: false,
      font: {
        size: 16,
      },
    },
    {
      x: 2,
      y: -12,
      text: "<b>Exhausted</b>",
      showarrow: false,
      font: {
        size: 16,
      },
    },
    {
      x: 6,
      y: 5,
      text: "<b>Naive</b>",
      showarrow: false,
      font: {
        size: 16,
      },
    },
  ];

  // since CD4/8 plots are not initially visible, trigger a resize event to ensure these plots are properly sized
  function handleSelect(key) {
    setTab(key); // store tab state
    const event = document.createEvent("Event");
    event.initEvent("resize", true, true);
    window.dispatchEvent(event);
  }

  return gene ? (
    <Tabs
      defaultActiveKey="tcell"
      activeKey={tab}
      id="tcellTabs"
      className="nav-tabs-custom"
      onSelect={handleSelect}>
      <Tab eventKey="tcell" title="T-Cell">
        <Row>
          <Col xl={12} className="d-flex justify-content-center">
            <Plot
              data={getTraces(tCellGeneExpression, traceColumns, traceConfig)}
              layout={merge({}, defaultLayout, {
                title: `<b>T Cells: ${gene} (n=${tCellGeneExpression.records.length})</b>`,
                xaxis: {
                  title: "t-SNE 1",
                },
                yaxis: {
                  title: "t-SNE 2",
                },
              })}
              config={defaultConfig}
              useResizeHandler
              className="mw-100"
              style={{ height: "800px", width: "1000px" }}
            />
          </Col>
        </Row>
      </Tab>

      <Tab eventKey="cd4/8" title="CD4/CD8">
        <Row>
          <Col xl={6}>
            <Plot
              data={getTraces(cd4GeneExpression, traceColumns, traceConfig)}
              layout={merge({}, defaultLayout, {
                title: `<b>CD4+ T Cells: ${gene}</b>`,
                annotations: cd4Annotations,
              })}
              config={defaultConfig}
              useResizeHandler
              className="w-100"
              style={{ height: "800px" }}
            />
          </Col>
          <Col xl={6}>
            <Plot
              data={getTraces(cd8GeneExpression, traceColumns, traceConfig)}
              layout={merge({}, defaultLayout, {
                title: `<b>CD8+ T Cells: ${gene}</b>`,
                annotations: cd8Annotations,
              })}
              config={defaultConfig}
              useResizeHandler
              className="w-100"
              style={{ height: "800px" }}
            />
          </Col>
        </Row>
      </Tab>
    </Tabs>
  ) : (
    <Tabs
      defaultActiveKey="tcell"
      activeKey={tab}
      id="tcellTabs"
      className="nav-tabs-custom"
      onSelect={handleSelect}>
      <Tab eventKey="tcell" title="T-Cell">
        <Row>
          <Col xl={12} className="d-flex justify-content-center">
            <Plot
              data={getTraces(tCells, traceColumns, traceConfig)}
              layout={merge({}, defaultLayout, {
                title: [
                  `<b>T Cells (n=${tCells.records.length})</b>`,
                  `<span style="font-size: 12px; color: grey; ">Click legend to show/hide types</span>`,
                ].join("<br>"),
                legend: {
                  title: {
                    text: "Type",
                    font: { size: 14 },
                  },
                },
                xaxis: {
                  title: "t-SNE 1",
                },
                yaxis: {
                  title: "t-SNE 2",
                },
                hovermode: "closest",
              })}
              config={defaultConfig}
              useResizeHandler
              className="mw-100"
              style={{ height: "800px", width: "1000px" }}
            />
          </Col>
        </Row>
      </Tab>

      <Tab eventKey="cd4/8" title="CD4/CD8">
        <Row>
          <Col xl={6}>
            <Plot
              data={getTraces(cd4, traceColumns, traceConfig)}
              layout={merge({}, defaultLayout, {
                title: [
                  `<b>CD4+ T Cells</b>`,
                  `<span style="font-size: 12px; color: grey; ">Click legend to show/hide types</span>`,
                ].join("<br>"),
                legend: {
                  title: {
                    text: "Type",
                    font: { size: 14 },
                  },
                },
                annotations: cd4Annotations,
              })}
              config={defaultConfig}
              useResizeHandler
              className="w-100"
              style={{ height: "800px" }}
            />
          </Col>
          <Col xl={6}>
            <Plot
              data={getTraces(cd8, traceColumns, traceConfig)}
              layout={merge({}, defaultLayout, {
                title: [
                  `<b>CD8+ T Cells</b>`,
                  `<span style="font-size: 12px;color: grey;border: 1px;">Click legend to show/hide types</span>`,
                ].join("<br>"),
                legend: {
                  title: {
                    text: "Type",
                    font: { size: 14 },
                  },
                },
                annotations: cd8Annotations,
              })}
              config={defaultConfig}
              useResizeHandler
              className="w-100"
              style={{ height: "800px" }}
            />
          </Col>
        </Row>
      </Tab>
    </Tabs>
  );
}
