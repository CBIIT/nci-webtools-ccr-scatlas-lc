import { useMemo, useRef, useState } from "react";
import {
  useRecoilState,
  useRecoilValue,
  useRecoilValueLoadable,
} from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Plot from "react-plotly.js";
import { getTraces } from "../../services/plot";
import { pointInPolygon, polygonBounds } from "../../services/geometry";
import { useSingleCellCohort } from "./single-cell-cohort-context";

const PLOT_HEIGHT = 800;

// Names what an expression panel shows: the gene, or the k-of-n subset of a
// set — mirrored from the spatial pages so labels stay consistent.
function featureLabelOf(activeFeature) {
  if (activeFeature.kind !== "set") return activeFeature.label;
  const { label, genes, setSize } = activeFeature;
  if (genes.length === 1) return `${label}: ${genes[0]}`;
  if (setSize && genes.length < setSize)
    return `${label} (mean, ${genes.length} of ${setSize} genes)`;
  return `${label} (mean, ${genes.length} genes)`;
}

// THE record visibility rule for a panel, in one place: a record shows when
// its type is not legend-hidden, it lies inside an applied lasso outline (if
// any), and it lies within the zoomed view. The display pipeline applies the
// same three filters as trace transforms; the title's "n=X of Y" count MUST
// derive from this predicate so the number and the pixels can never drift
// apart. Unlike the spatial predicate the lasso here is geometric — these
// tables have no cell_id, so membership is decided by coordinates.
function isRecordVisible(r, { hiddenTypes, lasso, viewRange }) {
  if (hiddenTypes && hiddenTypes.has(r.type)) return false;
  if (lasso && !lasso.polygons.every((p) => pointInPolygon(r.x, r.y, p)))
    return false;
  if (viewRange) {
    if (viewRange.x && (r.x < viewRange.x[0] || r.x > viewRange.x[1]))
      return false;
    if (viewRange.y && (r.y < viewRange.y[0] || r.y > viewRange.y[1]))
      return false;
  }
  return true;
}

// Apply the lasso by REMOVING outside cells from the traces, not by styling
// them invisible. A styled-out cell still participates in the next draw's
// selection styling, so with an applied lasso every SUBSEQUENT draw rendered
// the previously-hidden cells blank instead of dimmed — filtering keeps every
// draw's mid-drag styling identical to the first (outside the path dims,
// inside stays lit). Filtering per TRACE (not per record) keeps the trace
// list, names and color assignment stable: a cell type with nothing inside
// the outline keeps its (empty) trace and its legend entry, and nothing
// shifts onto the wrong palette slot. Membership is geometric (every applied
// outline must contain the point — successive lassos drill down), so it
// survives the records swapping under a gene change.
function filterByLasso(traces, lasso) {
  if (!lasso) return traces;
  const inside = (x, y) =>
    lasso.polygons.every((p) => pointInPolygon(x, y, p));
  return traces.map((trace) => {
    const keep = [];
    for (let i = 0; i < trace.x.length; i++) {
      if (inside(trace.x[i], trace.y[i])) keep.push(i);
    }
    return {
      ...trace,
      x: keep.map((i) => trace.x[i]),
      y: keep.map((i) => trace.y[i]),
      text: keep.map((i) => trace.text[i]),
      // per-point expression colors follow their cells; cmin/cmax are already
      // fixed numbers from the full records, so the color scale doesn't
      // re-derive from the survivors
      marker: Array.isArray(trace.marker?.color)
        ? { ...trace.marker, color: keep.map((i) => trace.marker.color[i]) }
        : trace.marker,
    };
  });
}

// The client's vocabulary for the two zoom behaviors: proportional keeps the
// 1:1 aspect; free zooms to the exact drawn box. Centered above the panels —
// the radios act on the graphs, so they live with them.
function ZoomModeRadios() {
  const { config, plotOptionsState } = useSingleCellCohort();
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  return (
    <div className="d-flex justify-content-center gap-4 mb-2">
      <Form.Check
        type="radio"
        name={`${config.id}-zoom-mode`}
        id={`${config.id}-zoom-proportional`}
        label="Proportional zoom"
        title="Zoom boxes keep the 1:1 aspect so clusters are never stretched"
        checked={!plotOptions.freeZoom}
        onChange={() => setPlotOptions({ ...plotOptions, freeZoom: false })}
      />
      <Form.Check
        type="radio"
        name={`${config.id}-zoom-mode`}
        id={`${config.id}-zoom-free`}
        label="Free zoom"
        title="Zoom to the exact drawn rectangle without preserving the 1:1 aspect (allows stretching)"
        checked={plotOptions.freeZoom}
        onChange={() => setPlotOptions({ ...plotOptions, freeZoom: true })}
      />
    </div>
  );
}

// One panel: the cell-type cluster view when no feature is active (or when
// this panel's table has none of the feature's genes), expression coloring
// otherwise. Each panel is an independent population with its own table,
// colors, axes, initial ranges and view state — nothing is mirrored between
// panels.
function PanelPlot({ panel, size, opacity, activeFeature, genesKey, freeZoom }) {
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

  // the records behind the current traces — the lasso's latched indices are
  // only valid while the traces still come from this same array
  const records = expression ? expression.records : cells;

  // the zoomed view; null renders the panel's configured initial ranges.
  // Kept in sync with user drag-zooms via onRelayout, so the range props
  // always match Plotly's internal state — that is what lets a code-driven
  // change (lasso zoom, reset) apply cleanly under a constant uirevision.
  const [viewRange, setViewRange] = useState(null);
  // the applied lasso isolation: the stack of drawn outlines (each new draw
  // drills further down); membership is geometric, so it survives the records
  // swapping under a gene change
  const [lasso, setLasso] = useState(null);
  // cell types toggled off via the legend — controlled state (rather than
  // Plotly's internal toggling) so the title's count can see them
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());
  // The active modebar drag tool, controlled for two reasons: left internal,
  // Plotly's WebGL selection overlay (the "focus" canvas that draws the
  // lassoed points) is only initialized on the next full replot, so the FIRST
  // lasso drawn after picking the tool rendered its inside blank; and our
  // frequent layout re-renders eventually reverted the tool to zoom. Routing
  // the tool choice through state forces that replot up front and makes the
  // choice stick.
  const [dragmode, setDragmode] = useState("zoom");

  function handleRelayout(event) {
    if (event.dragmode) setDragmode(event.dragmode);
    if (event["xaxis.autorange"] || event["yaxis.autorange"]) {
      setViewRange(null); // double-click / reset-axes restores the full view
      setLasso(null); // ...and brings all cells back
      return;
    }
    const rx =
      event["xaxis.range[0]"] !== undefined
        ? [event["xaxis.range[0]"], event["xaxis.range[1]"]]
        : null;
    const ry =
      event["yaxis.range[0]"] !== undefined
        ? [event["yaxis.range[0]"], event["yaxis.range[1]"]]
        : null;
    if (rx || ry) {
      setViewRange((prev) => ({
        x: rx ?? prev?.x ?? null,
        y: ry ?? prev?.y ?? null,
      }));
    }
  }

  // The lasso acts as a free-shape ZOOM into just the drawn cells (the
  // behavior established on the spatial pages): the panel zooms to the
  // outline's bounding box and every cell outside the outline disappears from
  // this panel. Drawing again drills further down; double-click resets view +
  // visibility. In Proportional zoom the box widens to keep 1:1; in Free zoom
  // it is exact.
  function handleSelected(event) {
    if (!event) return; // deselect / programmatic clears
    // an outline that caught no cells is ignored outright — appending it
    // would blank the panel, and zooming to it would show empty space
    if (!event.points?.length) return;
    const outline = event.lassoPoints ?? event.range;
    const ox = outline?.x;
    const oy = outline?.y;
    if (!ox?.length || !oy?.length) return;
    // a box-select reports { x: [min,max], y: [min,max] } — normalize to the
    // equivalent rectangle outline so everything downstream is one shape
    const polygon = event.lassoPoints
      ? { x: ox, y: oy }
      : { x: [ox[0], ox[1], ox[1], ox[0]], y: [oy[0], oy[0], oy[1], oy[1]] };
    setViewRange(polygonBounds(polygon));
    setLasso((prev) => ({ polygons: [...(prev?.polygons ?? []), polygon] }));
  }

  function handleLegendClick(event) {
    const name = event.data[event.curveNumber]?.name;
    if (name == null) return false;
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    return false; // suppress Plotly's internal toggle — this state is the truth
  }
  function handleLegendDoubleClick(event) {
    const traces = event.data ?? [];
    const name = traces[event.curveNumber]?.name;
    if (name == null) return false;
    setHiddenTypes((prev) => {
      const others = traces.map((t) => t.name).filter((t) => t !== name);
      const isolated =
        !prev.has(name) && others.every((t) => prev.has(t)) && others.length > 0;
      return isolated ? new Set() : new Set(others);
    });
    return false;
  }

  // Title count reflects what the panel actually shows: legend-hidden types
  // (cluster view only — the expression view has no legend), an applied
  // lasso, and the zoomed region all narrow it.
  const activeHidden = !expression && hiddenTypes.size > 0 ? hiddenTypes : null;
  const countFiltersActive = !!lasso || !!viewRange || !!activeHidden;
  const shownCount = useMemo(() => {
    if (!countFiltersActive) return records.length;
    let n = 0;
    const filters = { hiddenTypes: activeHidden, lasso, viewRange };
    for (const r of records) if (isRecordVisible(r, filters)) n += 1;
    return n;
  }, [records, countFiltersActive, activeHidden, lasso, viewRange]);

  function titleOf() {
    const base = expression ? `${panel.label}: ${featureLabel}` : panel.label;
    const count = countFiltersActive
      ? `${shownCount.toLocaleString()} of ${records.length.toLocaleString()}`
      : records.length.toLocaleString();
    const heading = `<b>${base} (n=${count})</b>`;
    if (expression || !panel.legend?.hint) return heading;
    return [
      heading,
      `<span style="font-size: 12px; color: grey;">${panel.legend.hint}</span>`,
    ].join("<br>");
  }

  // explicit ranges: the zoomed view when one is set, the configured initial
  // ranges otherwise (a null initial member autoranges)
  const rangeX = viewRange?.x ?? panel.initialRange.x;
  const rangeY = viewRange?.y ?? panel.initialRange.y;

  const layout = {
    xaxis: {
      title: panel.axes.x,
      zeroline: false,
      // aspect lock is optional (the zoom-mode radios): locked keeps 1:1 so
      // clusters aren't distorted; the lock must go the moment Free zoom is
      // chosen — while scaleanchor is active Plotly constrains the zoombox
      // DURING the drag, so the free-drawn rectangle otherwise never exists
      ...(!freeZoom && {
        scaleanchor: "y",
        scaleratio: 1,
        constrain: "domain",
      }),
      ...(rangeX && {
        range: [...rangeX],
        ...(viewRange?.x && { autorange: false }),
      }),
    },
    yaxis: {
      title: panel.axes.y,
      zeroline: false,
      // constrain "domain" (as on x): without it Plotly's constraint pass
      // WIDENS an explicit y range (a lasso bbox) to keep 1:1, showing cells
      // the title count excludes
      ...(!freeZoom && { constrain: "domain" }),
      ...(rangeY && {
        range: [...rangeY],
        ...(viewRange?.y && { autorange: false }),
      }),
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
    dragmode,
    // constant per panel: zoom, lasso and legend state survive gene changes —
    // the swap between cluster and expression coloring only changes the data
    uirevision: panel.id,
    ...(panel.annotations && { annotations: panel.annotations }),
    title: titleOf(),
  };

  const plotConfig = {
    displayModeBar: true,
    // the lasso here ZOOMS to the drawn region (isolating its cells), so the
    // toolbar names it accordingly — the locale dictionary is how Plotly
    // retitles a stock modebar button
    locale: "en",
    locales: { en: { dictionary: { "Lasso Select": "Lasso zoom" } } },
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
    // NO `selected` style here, deliberately: for scattergl Plotly builds the
    // selection overlay from ONLY the properties listed in selected.marker —
    // declaring just an opacity drops the per-point colors, which blanked the
    // inside of the lasso while drawing. Leaving it undefined keeps the full
    // base styling on selected cells (withLasso owns the unselected side).
  };

  // __value is the per-record mean over the feature's genes available in this
  // panel (a single gene's mean is itself)
  const baseData = useMemo(
    () =>
      expression
        ? getTraces(expression.records, traceConfig, "__value")
        : getTraces(cells, traceConfig, null, panel.colors ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expression, cells, size, opacity, panel.colors],
  );

  const data = useMemo(() => {
    // dim (never hide) whatever falls outside a path DURING a draw — the
    // applied isolation is done by filtering, so this styling is all a drag
    // ever shows. While a lasso is applied the drawn outline persists as a
    // live selection context, under which selectedpoints:null reads as
    // "nothing selected" and dims the whole panel — so the surviving points
    // are all explicitly marked selected (full base styling). Without a
    // lasso, the explicit null is what clears a plot's internal selection.
    const lassoed = filterByLasso(baseData, lasso).map((t) => ({
      ...t,
      selectedpoints: lasso ? t.x.map((_, i) => i) : null,
      unselected: { marker: { opacity: opacity * 0.2 } },
    }));
    if (expression) return lassoed; // no legend — nothing to hide
    return lassoed.map((t) => ({
      ...t,
      visible: hiddenTypes.has(t.name) ? "legendonly" : true,
    }));
  }, [baseData, lasso, opacity, expression, hiddenTypes]);

  return (
    <div className="position-relative">
      <Plot
        data={data}
        layout={layout}
        config={plotConfig}
        onRelayout={handleRelayout}
        onSelected={handleSelected}
        onDeselect={() => setLasso(null)}
        onLegendClick={handleLegendClick}
        onLegendDoubleClick={handleLegendDoubleClick}
        useResizeHandler
        className="w-100"
        style={{
          height: `${PLOT_HEIGHT}px`,
          ...(panel.layout?.width && {
            maxWidth: panel.layout.width,
            margin: "0 auto",
          }),
        }}
      />
      {updating && currentLabel && (
        <div
          className="position-absolute top-0 start-0 d-flex align-items-center text-muted mt-2 ms-4"
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
  const { size, opacity, activeFeature, freeZoom } =
    useRecoilValue(plotOptionsState);
  const genesKey = activeFeature ? activeFeature.genes.join(",") : "";

  return (
    <div>
      <ZoomModeRadios />
      <Row>
        {panels.map((panel) => (
          <Col xl={panel.layout?.col ?? 6} key={panel.id}>
            <PanelPlot
              panel={panel}
              size={size}
              opacity={opacity}
              activeFeature={activeFeature}
              genesKey={genesKey}
              freeZoom={freeZoom}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
