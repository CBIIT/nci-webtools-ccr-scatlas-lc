import { useRef } from "react";
import { useRecoilValue, useRecoilValueLoadable } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Plot from "react-plotly.js";
import { getTraces } from "../../services/plot";
import { useSingleCellCohort } from "./single-cell-cohort-context";

const PLOT_HEIGHT = 800;

// Names what an expression panel shows: the gene, or (later) the k-of-n
// subset of a set — mirrored from the spatial pages so labels stay consistent.
function featureLabelOf(activeFeature) {
  if (activeFeature.kind !== "set") return activeFeature.label;
  const { label, genes, setSize } = activeFeature;
  if (genes.length === 1) return `${label}: ${genes[0]}`;
  if (setSize && genes.length < setSize)
    return `${label} (mean, ${genes.length} of ${setSize} genes)`;
  return `${label} (mean, ${genes.length} genes)`;
}

// One panel: the cell-type cluster view when no feature is active (or when
// this panel's table has none of the feature's genes), expression coloring
// otherwise. Each panel is an independent population with its own table,
// colors, axes and initial ranges — nothing is mirrored between panels.
function PanelPlot({ panel, size, opacity, activeFeature, genesKey }) {
  const { config } = useSingleCellCohort();
  const cells = useRecoilValue(panel.cellsQuery);

  // The expression fetch is a non-suspending loadable — while a new feature
  // loads, the previous coloring (and ITS label, so old data never wears the
  // new name) stays on screen instead of blanking the panel behind the
  // page-level Suspense loader.
  const currentLabel = activeFeature ? featureLabelOf(activeFeature) : null;
  const loadable = useRecoilValueLoadable(panel.expressionQuery(genesKey));
  if (loadable.state === "hasError") throw loadable.contents;
  const lastRef = useRef(null);
  if (loadable.state === "hasValue") {
    lastRef.current = { expression: loadable.contents, label: currentLabel };
  }
  const shown =
    loadable.state === "hasValue"
      ? { expression: loadable.contents, label: currentLabel }
      : lastRef.current;
  const expression = shown?.expression ?? null;
  const featureLabel = shown?.label ?? currentLabel;
  const updating = loadable.state === "loading";
  // a feature is active but none of its genes exist in this panel's table —
  // the panel stays on its cluster view and says why
  const unavailable = !!activeFeature && !updating && !expression;

  const layout = {
    xaxis: {
      title: panel.axes.x,
      zeroline: false,
      scaleanchor: "y",
      scaleratio: 1,
      constrain: "domain",
      ...(panel.initialRange.x && { range: [...panel.initialRange.x] }),
    },
    yaxis: {
      title: panel.axes.y,
      zeroline: false,
      ...(panel.initialRange.y && { range: [...panel.initialRange.y] }),
    },
    legend: {
      itemsizing: "constant",
      itemwidth: 40,
      ...(panel.legend?.traceOrder && { traceOrder: panel.legend.traceOrder }),
      ...(!expression &&
        panel.legend?.title && {
          title: { text: panel.legend.title, font: { size: 14 } },
        }),
    },
    hovermode: "closest",
    uirevision: (expression && featureLabel) || 1,
    ...(panel.annotations && { annotations: panel.annotations }),
    title: expression
      ? `<b>${panel.label}: ${featureLabel} (n=${expression.records.length})</b>`
      : [
          `<b>${panel.label} (n=${cells.length})</b>`,
          ...(panel.legend?.hint
            ? [
                `<span style="font-size: 12px; color: grey;">${panel.legend.hint}</span>`,
              ]
            : []),
        ].join("<br>"),
  };

  const plotConfig = {
    displayModeBar: true,
    toImageButtonOptions: {
      format: "svg",
      filename: `${config.id}_${panel.id}`,
      height: 1000,
      width: 1000,
      scale: 1,
    },
    displaylogo: false,
    modeBarButtonsToRemove: [
      "select2d",
      "hoverCompareCartesian",
      "hoverClosestCartesian",
    ],
  };

  const traceConfig = {
    showlegend: !expression,
    hoverinfo: !expression ? "name" : "text+name",
    hoverlabel: {
      namelength: -1,
    },
    marker: {
      size,
      opacity,
      colorbar: {
        thickness: 20,
      },
      ...(!expression && {
        showscale: false,
      }),
    },
  };

  // __value is the per-record mean over the feature's genes available in this
  // panel (a single gene's mean is itself)
  const data = expression
    ? getTraces(expression.records, traceConfig, "__value")
    : getTraces(cells, traceConfig, null, panel.colors ?? undefined);

  return (
    <div className="position-relative">
      <Plot
        data={data}
        layout={layout}
        config={plotConfig}
        useResizeHandler
        className="w-100"
        style={{ height: `${PLOT_HEIGHT}px`, ...(panel.layout?.width && { maxWidth: panel.layout.width, margin: "0 auto" }) }}
      />
      {updating && currentLabel && (
        <div
          className="position-absolute top-0 start-50 translate-middle-x d-flex align-items-center text-muted mt-2"
          role="status">
          <Spinner animation="border" size="sm" className="me-2" />
          <span className="small">Loading {currentLabel}…</span>
        </div>
      )}
      {unavailable && (
        <div className="text-muted small text-center">
          {currentLabel} is not measured in this panel — showing cell types.
        </div>
      )}
    </div>
  );
}

export default function SingleCellCohortPlots() {
  const { panels, plotOptionsState } = useSingleCellCohort();
  const { size, opacity, activeFeature } = useRecoilValue(plotOptionsState);
  const genesKey = activeFeature ? activeFeature.genes.join(",") : "";

  return (
    <Row>
      {panels.map((panel) => (
        <Col xl={panel.layout?.col ?? 6} key={panel.id}>
          <PanelPlot
            panel={panel}
            size={size}
            opacity={opacity}
            activeFeature={activeFeature}
            genesKey={genesKey}
          />
        </Col>
      ))}
    </Row>
  );
}
