import { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useRecoilValueLoadable } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Plot from "react-plotly.js";
import merge from "lodash/merge";
import groupBy from "lodash/groupBy";
import { getTraces } from "../../services/plot";
import {
  plotOptionsState,
  cellsQuery,
  featureExpressionQuery,
} from "./tiger-lc.state";

// Colors for the four cell types, in getTraces' sorted (alphabetical) group order:
// Epithelial, Immune, Malignant, Stromal.
const cellTypeColors = ["#3A5FCD", "#FF8C00", "#EE2C2C", "#32CD32"];

// Project the lassoed cell ids onto a trace list as per-trace selectedpoints
// indices — shared by both plots of a pair (Plotly selections are otherwise
// per-plot). With no lasso active, selectedpoints is EXPLICITLY nulled: the
// plot the user drew on keeps an internal selection of its own, and only an
// explicit null clears it (autoscale/reset/deselect would otherwise leave
// that plot still filtered).
function withLasso(traces, lassoCells) {
  if (!lassoCells)
    return traces.map((trace) => ({ ...trace, selectedpoints: null }));
  return traces.map((trace) => ({
    ...trace,
    selectedpoints: trace.customdata
      .map((cellId, i) => (lassoCells.has(cellId) ? i : -1))
      .filter((i) => i >= 0),
  }));
}

const PLOT_HEIGHT = 340;
const ROW_MIN_HEIGHT = PLOT_HEIGHT + 56; // plots + heading, keeps scroll stable

// Mount a row's plots only while it is near the viewport, and unmount them
// again once scrolled far away so the DOM doesn't accumulate hundreds of
// thousands of SVG points — the fixed-height placeholder preserves the
// scrollbar, keeping all samples reachable (RTM: the page must be able to
// show ALL samples; capping the list is not allowed). Two thresholds give
// hysteresis: mount when within 600px, unmount only beyond 1600px — a single
// threshold thrashed rows in/out during fast scrolling, leaving plots blank
// or mid-init.
function useNearViewport() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const mountObserver = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      { rootMargin: "600px 0px" },
    );
    const unmountObserver = new IntersectionObserver(
      ([entry]) => !entry.isIntersecting && setNear(false),
      { rootMargin: "1600px 0px" },
    );
    mountObserver.observe(el);
    unmountObserver.observe(el);
    return () => {
      mountObserver.disconnect();
      unmountObserver.disconnect();
    };
  }, []);
  return [ref, near];
}

// One sample: left plot colored by cell type, right by the active feature's
// expression (single gene, or mean of a set/subset). The left plot's data is
// the stable cells slice and its traces are memoized, so changing the gene
// re-renders ONLY the right plot (NCIATWP-11134). Spatial x/y are real slide
// millimetres — equal aspect (scaleanchor) so the tissue isn't distorted.
function SamplePairRow({
  sample,
  leftRecords,
  rightRecords,
  size,
  opacity,
  featureLabel,
  samplesLabel,
  cmin,
  cmax,
  freeZoom,
}) {
  const [ref, near] = useNearViewport();
  // shared view for the pair: zoom/pan/reset on either plot mirrors to the
  // other (bidirectional sync per the 7/7 client-review minutes). null = auto.
  // uirevision is the (constant) sample id, so the view also survives gene
  // changes — only the coloring swaps.
  const [viewRange, setViewRange] = useState(null);
  // cell ids inside the drawn lasso — applied to BOTH plots' traces so the
  // pair consistently shows only the lassoed cells (outside cells render at
  // opacity 0). null = no lasso active, everything visible.
  const [lassoCells, setLassoCells] = useState(null);

  function handleRelayout(event) {
    if (event["xaxis.autorange"] || event["yaxis.autorange"]) {
      setViewRange(null); // double-click / reset-axes on one resets both
      setLassoCells(null); // ...and brings all cells back
      return;
    }
    if (
      event["xaxis.range[0]"] !== undefined ||
      event["yaxis.range[0]"] !== undefined
    ) {
      setViewRange((prev) => ({
        x:
          event["xaxis.range[0]"] !== undefined
            ? [event["xaxis.range[0]"], event["xaxis.range[1]"]]
            : (prev?.x ?? null),
        y:
          event["yaxis.range[0]"] !== undefined
            ? [event["yaxis.range[0]"], event["yaxis.range[1]"]]
            : (prev?.y ?? null),
      }));
    }
  }

  // Experimental (the open lasso-behavior question from the NCIATWP-10324
  // comment): the lasso acts as a free-shape ZOOM into just the drawn cells —
  // the pair zooms to the outline's bounding box and every cell OUTSIDE the
  // lasso is hidden (opacity 0) on both plots, so the view shows exactly the
  // lassoed region. Double-click resets view + visibility. With the aspect
  // lock on the box widens to keep 1:1 mm; with Free-form zoom it is exact.
  function handleSelected(event) {
    if (!event) return; // deselect / programmatic clears
    const outline = event.lassoPoints ?? event.range;
    if (!outline?.x?.length || !outline?.y?.length) return;
    setViewRange({
      x: [Math.min(...outline.x), Math.max(...outline.x)],
      y: [Math.min(...outline.y), Math.max(...outline.y)],
    });
    setLassoCells(
      event.points?.length
        ? new Set(event.points.map((pt) => pt.customdata))
        : null,
    );
  }



  const axes = {
    xaxis: {
      title: { text: "Spatial X (mm)", font: { size: 11 } },
      zeroline: false,
      // aspect lock is optional (experimental "Free-form zoom" switch): locked
      // keeps 1:1 mm so tissue isn't distorted; free zooms to the exact drawn
      // rectangle at the cost of stretch
      ...(!freeZoom && { scaleanchor: "y", scaleratio: 1, constrain: "domain" }),
      ...(viewRange?.x && { range: [...viewRange.x], autorange: false }),
    },
    yaxis: {
      title: { text: "Spatial Y (mm)", font: { size: 11 } },
      zeroline: false,
      ...(viewRange?.y && { range: [...viewRange.y], autorange: false }),
    },
    margin: { t: 36, r: 10, b: 40, l: 50 },
    hovermode: "closest",
    uirevision: sample,
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    toImageButtonOptions: {
      format: "svg",
      filename: `tigerlc_${sample}`,
      height: 1000,
      width: 1000,
      scale: 1,
    },
    modeBarButtonsToRemove: [
      "select2d",
      "hoverCompareCartesian",
      "hoverClosestCartesian",
    ],
  };

  // memoized so Plotly only re-draws the left plot when the cells themselves
  // or the marker options change — never on gene selection
  const leftData = useMemo(
    () =>
      getTraces(
        leftRecords,
        {
          // SVG scatter, not scattergl: a sample is only ~2k points, and WebGL
          // contexts are browser-capped (~8-16) — with many mounted rows the
          // older canvases were silently evicted and went blank
          type: "scatter",
          showlegend: true,
          hovertemplate:
            "Cell ID: %{customdata}<br>Cell type: %{fullData.name}<extra></extra>",
          hoverlabel: { namelength: -1 },
          marker: { size, opacity, showscale: false },
          // lasso-zoom: cells outside the drawn shape disappear entirely
          selected: { marker: { opacity } },
          unselected: { marker: { opacity: 0 } },
        },
        null,
        cellTypeColors,
      ),
    [leftRecords, size, opacity],
  );

  const rightData = useMemo(
    () =>
      rightRecords
        ? getTraces(
            rightRecords,
            {
              type: "scatter", // SVG — see the cell-type plot's note
              showlegend: false,
              hovertemplate: `Cell ID: %{customdata}<br>${featureLabel}: %{text}<extra></extra>`,
              hoverlabel: { namelength: -1 },
              // fixed global scale so expression color is comparable across
              // all sample rows
              marker: {
                size,
                opacity,
                cmin,
                cmax,
                colorbar: { thickness: 12, tickfont: { size: 9 } },
              },
              // see the cell-type plot: outside-lasso cells are hidden
              selected: { marker: { opacity } },
              unselected: { marker: { opacity: 0 } },
            },
            "__value",
          )
        : null,
    [rightRecords, size, opacity, cmin, cmax, featureLabel],
  );

  const leftShown = useMemo(
    () => withLasso(leftData, lassoCells),
    [leftData, lassoCells],
  );
  const rightShown = useMemo(
    () => (rightData ? withLasso(rightData, lassoCells) : null),
    [rightData, lassoCells],
  );

  return (
    <div ref={ref} style={{ minHeight: ROW_MIN_HEIGHT }} className="mb-3">
      {/* AC3: center-aligned row header — SampleID + the active Gene/Gene Set
          and Samples filter selections */}
      <h3 className="h6 mb-1 text-center">
        {sample}{" "}
        <span className="text-muted fw-normal">
          · {featureLabel} · {samplesLabel} · n={leftRecords.length}
        </span>
      </h3>
      {near ? (
        <Row className="g-2">
          <Col xl={6}>
            <Plot
              data={leftShown}
              layout={merge({}, axes, {
                title: { text: "Cell type", font: { size: 13 } },
                legend: {
                  itemsizing: "constant",
                  itemwidth: 30,
                  font: { size: 10 },
                },
              })}
              config={config}
              onRelayout={handleRelayout}
              onSelected={handleSelected}
              onDeselect={() => setLassoCells(null)}
              useResizeHandler
              className="w-100"
              style={{ height: `${PLOT_HEIGHT}px` }}
            />
          </Col>
          <Col xl={6}>
            {rightData ? (
              <Plot
                data={rightShown}
                layout={merge({}, axes, {
                  title: { text: featureLabel, font: { size: 13 } },
                })}
                config={config}
                onRelayout={handleRelayout}
                onSelected={handleSelected}
                onDeselect={() => setLassoCells(null)}
                useResizeHandler
                className="w-100"
                style={{ height: `${PLOT_HEIGHT}px` }}
              />
            ) : (
              <div
                className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
                style={{ height: PLOT_HEIGHT }}>
                <Spinner animation="border" size="sm" className="me-2" />
                <span className="small">Loading expression…</span>
              </div>
            )}
          </Col>
        </Row>
      ) : (
        <div
          className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
          style={{ height: PLOT_HEIGHT }}>
          <span className="small">Scroll to load {sample}</span>
        </div>
      )}
    </div>
  );
}

export default function TigerLcPlots() {
  const { size, opacity, activeFeature, samples, freeZoom } =
    useRecoilValue(plotOptionsState);
  // stable base records (coords/types/samples): drives the row list and the
  // left plots, and never re-fetches on gene changes
  const cells = useRecoilValue(cellsQuery);

  // name what the right plots show: the gene, the k-of-n subset, or the full
  // set — so set-level vs gene-level coloring is always explicit
  const isSet = activeFeature.kind === "set";
  const setLabel = () => {
    const { label, genes, setSize } = activeFeature;
    if (genes.length === 1) return `${label}: ${genes[0]}`;
    if (setSize && genes.length < setSize)
      return `${label} (mean, ${genes.length} of ${setSize} genes)`;
    return `${label} (mean, ${genes.length} genes)`;
  };
  const currentLabel = isSet ? setLabel() : activeFeature.label;

  // NCIATWP-11134: the expression fetch is a non-suspending loadable — while
  // a new gene/set loads, the previous coloring (and ITS label, so old data
  // never wears the new name) stays on screen; only the right plots swap when
  // the data arrives. No page-level Suspense flash.
  const genesKey = activeFeature.genes.join(",");
  const loadable = useRecoilValueLoadable(featureExpressionQuery(genesKey));
  if (loadable.state === "hasError") throw loadable.contents;
  const lastRef = useRef(null);
  if (loadable.state === "hasValue") {
    lastRef.current = { records: loadable.contents, label: currentLabel };
  }
  const shown =
    loadable.state === "hasValue"
      ? { records: loadable.contents, label: currentLabel }
      : lastRef.current;
  const featureRecords = shown?.records ?? null;
  const featureLabel = shown?.label ?? currentLabel;
  const updating = loadable.state === "loading";

  // samples: null = all; otherwise keep only the selected samples' rows
  const sampleSet = samples == null ? null : new Set(samples);
  const cellsBySample = useMemo(() => groupBy(cells, "sample"), [cells]);
  const featureBySample = useMemo(
    () => (featureRecords ? groupBy(featureRecords, "sample") : null),
    [featureRecords],
  );
  const totalSamples = Object.keys(cellsBySample).length;
  const sampleIds = Object.keys(cellsBySample)
    .filter((s) => !sampleSet || sampleSet.has(s))
    .sort();
  // echoed in each row header: "All samples (N)" or "k of N samples"
  const samplesLabel =
    samples == null
      ? `All samples (${totalSamples})`
      : `${sampleIds.length} of ${totalSamples} samples`;

  // global expression range across every shown sample (fixed colorbar scale)
  let cmin = Infinity;
  let cmax = -Infinity;
  if (featureRecords) {
    for (const r of featureRecords) {
      if (sampleSet && !sampleSet.has(r.sample)) continue;
      if (r.__value < cmin) cmin = r.__value;
      if (r.__value > cmax) cmax = r.__value;
    }
  }

  let totalShown = 0;
  for (const s of sampleIds) totalShown += cellsBySample[s].length;

  return (
    <div>
      <div className="text-center mb-2">
        <h2 className="h5 mb-0">
          TIGER-LC iCCA{" "}
          <span className="text-muted fw-normal">— {featureLabel}</span>
          {updating && (
            <Spinner
              animation="border"
              size="sm"
              className="ms-2 align-middle"
              title={`Loading ${currentLabel}…`}
            />
          )}
        </h2>
        <span className="text-muted small">
          {sampleIds.length} sample{sampleIds.length === 1 ? "" : "s"},{" "}
          n={totalShown}
        </span>
      </div>
      {sampleIds.map((sample) => (
        <SamplePairRow
          key={sample}
          sample={sample}
          leftRecords={cellsBySample[sample]}
          rightRecords={featureBySample ? featureBySample[sample] : null}
          size={size}
          opacity={opacity}
          featureLabel={featureLabel}
          samplesLabel={samplesLabel}
          cmin={cmin}
          cmax={cmax}
          freeZoom={freeZoom}
        />
      ))}
    </div>
  );
}
