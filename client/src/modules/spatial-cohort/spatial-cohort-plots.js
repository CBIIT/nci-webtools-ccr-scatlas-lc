import { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useRecoilValueLoadable } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Plot from "react-plotly.js";
import merge from "lodash/merge";
import groupBy from "lodash/groupBy";
import { getTraces } from "../../services/plot";
import { useSpatialCohort } from "./spatial-cohort-context";

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
// again once scrolled far away so the browser doesn't accumulate every row's
// points (SVG nodes or WebGL contexts, per the cohort's renderer) — the
// fixed-height placeholder preserves the scrollbar, keeping all samples
// reachable (RTM: the page must be able to show ALL samples; capping the list
// is not allowed). Two thresholds give hysteresis: mount when within
// mountMargin, unmount only beyond unmountMargin — a single threshold thrashed
// rows in/out during fast scrolling, leaving plots blank or mid-init.
function useNearViewport({ mountMargin = "600px", unmountMargin = "1600px" }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const mountObserver = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      { rootMargin: `${mountMargin} 0px` },
    );
    const unmountObserver = new IntersectionObserver(
      ([entry]) => !entry.isIntersecting && setNear(false),
      { rootMargin: `${unmountMargin} 0px` },
    );
    mountObserver.observe(el);
    unmountObserver.observe(el);
    return () => {
      mountObserver.disconnect();
      unmountObserver.disconnect();
    };
  }, [mountMargin, unmountMargin]);
  return [ref, near];
}

// Names what the right plots show: the gene, the k-of-n subset, or the full
// set — so set-level vs gene-level coloring is always explicit.
function featureLabelOf(activeFeature) {
  if (activeFeature.kind !== "set") return activeFeature.label;
  const { label, genes, setSize } = activeFeature;
  if (genes.length === 1) return `${label}: ${genes[0]}`;
  if (setSize && genes.length < setSize)
    return `${label} (mean, ${genes.length} of ${setSize} genes)`;
  return `${label} (mean, ${genes.length} genes)`;
}

// One sample: left plot colored by cell type, right by the active feature's
// expression (single gene, or mean of a set/subset). The left plot's data is
// the stable cells slice and its traces are memoized, so changing the gene
// re-renders ONLY the right plot. Spatial x/y are real slide millimetres —
// equal aspect (scaleanchor) so the tissue isn't distorted. Purely
// presentational: the fetch-mode containers below own the data and pass
// innerRef/near from useNearViewport. leftRecords === null means the sample's
// cells are still loading (perSample mode).
function SamplePairRow({
  innerRef,
  near,
  sample,
  leftRecords,
  // perSample rows pass the count separately: their records are released when
  // the row scrolls out of the mount window, but the header keeps reading n=…
  cellCount = leftRecords?.length ?? null,
  rightRecords,
  size,
  opacity,
  featureLabel,
  samplesLabel,
  updating,
  cmin,
  cmax,
  freeZoom,
  cellsError,
  featureError,
  onRetry,
}) {
  const { config } = useSpatialCohort();
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

  const plotConfig = {
    displayModeBar: true,
    displaylogo: false,
    toImageButtonOptions: {
      format: "svg",
      filename: `${config.id}_${sample}`,
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

  // colors looked up by the types PRESENT in this sample (getTraces colors
  // groups by sorted index) — a sample missing a cell type must not shift the
  // remaining types onto the wrong colors
  const rowColors = useMemo(() => {
    if (!leftRecords) return [];
    return [...new Set(leftRecords.map((r) => r.type))]
      .sort((a, b) => a.localeCompare(b))
      .map((t) => config.cellTypeColors[t]);
  }, [leftRecords, config.cellTypeColors]);

  // memoized so Plotly only re-draws the left plot when the cells themselves
  // or the marker options change — never on gene selection
  const leftData = useMemo(
    () =>
      leftRecords
        ? getTraces(
            leftRecords,
            {
              // trace type per cohort config: "scatter" (SVG) suits many small
              // samples (WebGL contexts are browser-capped ~8-16 and silently
              // evicted); "scattergl" suits samples of 100k+ points, paired
              // with a tighter mount window to stay under the context cap
              type: config.renderer,
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
            rowColors,
          )
        : null,
    [leftRecords, size, opacity, rowColors, config.renderer],
  );

  const rightData = useMemo(
    () =>
      rightRecords
        ? getTraces(
            rightRecords,
            {
              type: config.renderer, // see the cell-type plot's note
              showlegend: false,
              hovertemplate: `Cell ID: %{customdata}<br>${featureLabel}: %{text}<extra></extra>`,
              hoverlabel: { namelength: -1 },
              // fixed scale so expression color is comparable — across all
              // sample rows (full fetch) or within the row (perSample)
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
    [rightRecords, size, opacity, cmin, cmax, featureLabel, config.renderer],
  );

  const leftShown = useMemo(
    () => (leftData ? withLasso(leftData, lassoCells) : null),
    [leftData, lassoCells],
  );
  const rightShown = useMemo(
    () => (rightData ? withLasso(rightData, lassoCells) : null),
    [rightData, lassoCells],
  );

  const errorBox = (err) => (
    <Alert variant="danger" className="d-flex align-items-center gap-3">
      <div className="flex-grow-1 small">
        Could not load this sample. {err.message}
      </div>
      <Button size="sm" variant="outline-danger" onClick={onRetry}>
        Retry
      </Button>
    </Alert>
  );

  const loadingBox = (message) => (
    <div
      className="bg-light border rounded d-flex align-items-center justify-content-center text-muted"
      style={{ height: PLOT_HEIGHT }}>
      <Spinner animation="border" size="sm" className="me-2" />
      <span className="small">{message}</span>
    </div>
  );

  return (
    <div ref={innerRef} style={{ minHeight: ROW_MIN_HEIGHT }} className="mb-3">
      {/* AC3: center-aligned row header — SampleID + the active Gene/Gene Set
          and Samples filter selections */}
      <h3 className="h6 mb-1 text-center">
        {sample}{" "}
        <span className="text-muted fw-normal">
          · {featureLabel} · {samplesLabel}
          {cellCount != null && <> · n={cellCount}</>}
        </span>
        {updating && (
          <Spinner
            animation="border"
            size="sm"
            className="ms-2 align-middle"
            title="Loading expression…"
          />
        )}
      </h3>
      {/* the cells drive BOTH plots, so their failure replaces the row; an
          expression failure leaves the cell-type plot standing and reports in
          the column it belongs to */}
      {cellsError ? (
        errorBox(cellsError)
      ) : near ? (
        leftShown ? (
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
                config={plotConfig}
                onRelayout={handleRelayout}
                onSelected={handleSelected}
                onDeselect={() => setLassoCells(null)}
                useResizeHandler
                className="w-100"
                style={{ height: `${PLOT_HEIGHT}px` }}
              />
            </Col>
            <Col xl={6}>
              {rightShown ? (
                <Plot
                  data={rightShown}
                  layout={merge({}, axes, {
                    title: { text: featureLabel, font: { size: 13 } },
                  })}
                  config={plotConfig}
                  onRelayout={handleRelayout}
                  onSelected={handleSelected}
                  onDeselect={() => setLassoCells(null)}
                  useResizeHandler
                  className="w-100"
                  style={{ height: `${PLOT_HEIGHT}px` }}
                />
              ) : (
                featureError ? (
                  errorBox(featureError)
                ) : (
                  loadingBox("Loading expression…")
                )
              )}
            </Col>
          </Row>
        ) : (
          loadingBox(`Loading ${sample}…`)
        )
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

// Shared plots heading: cohort title + what the expression plots show.
function PlotsHeader({ title, featureLabel, updating, updatingTitle, subtitle }) {
  return (
    <div className="text-center mb-2">
      <h2 className="h5 mb-0">
        {title} <span className="text-muted fw-normal">— {featureLabel}</span>
        {updating && (
          <Spinner
            animation="border"
            size="sm"
            className="ms-2 align-middle"
            title={updatingTitle}
          />
        )}
      </h2>
      <span className="text-muted small">{subtitle}</span>
    </div>
  );
}

// "full" fetch mode: one download of the whole cells table drives every row;
// expression is fetched globally and grouped, and the color scale is global so
// expression color is comparable across all sample rows.
function FullFetchPlots() {
  const state = useSpatialCohort();
  const { config } = state;
  const { size, opacity, activeFeature, samples, freeZoom } = useRecoilValue(
    state.plotOptionsState,
  );
  // stable base records (coords/types/samples): drives the row list and the
  // left plots, and never re-fetches on gene changes
  const cells = useRecoilValue(state.cellsQuery);
  const currentLabel = featureLabelOf(activeFeature);

  // the expression fetch is a non-suspending loadable — while a new gene/set
  // loads, the previous coloring (and ITS label, so old data never wears the
  // new name) stays on screen; only the right plots swap when the data
  // arrives. No page-level Suspense flash.
  const genesKey = activeFeature.genes.join(",");
  const loadable = useRecoilValueLoadable(
    state.featureExpressionQuery(genesKey),
  );
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
      <PlotsHeader
        title={config.title}
        featureLabel={featureLabel}
        updating={updating}
        updatingTitle={`Loading ${currentLabel}…`}
        subtitle={`${sampleIds.length} sample${sampleIds.length === 1 ? "" : "s"}, n=${totalShown}`}
      />
      {sampleIds.map((sample) => (
        <FullFetchRow
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

// full-mode row: only adds the lazy-mount viewport tracking
function FullFetchRow(props) {
  const { config } = useSpatialCohort();
  const [ref, near] = useNearViewport(config);
  return <SamplePairRow innerRef={ref} near={near} {...props} />;
}

// "perSample" fetch mode: the row list comes from the configured sample ids and
// each row fetches its own cells + expression only once scrolled near the
// viewport — nothing ever downloads the whole cells table. The expression
// color scale is per row (a global scale would require all samples' data).
//
// A row holds its records only while it is inside the mount window: scrolling
// away drops them, leaving the sample retained solely by the state module's
// bounded LRU. (An earlier `started` latch kept every visited row's records
// alive, which put the whole cohort back in memory after one pass down the
// page — the exact cost perSample fetching exists to avoid.) Only the cell
// count survives, so a revisited row's header still reads n=… immediately.
function PerSampleRow({ sample, samplesLabel, currentLabel, genesKey }) {
  const state = useSpatialCohort();
  const { config } = state;
  const { size, opacity, freeZoom } = useRecoilValue(state.plotOptionsState);
  const [ref, near] = useNearViewport(config);

  const [leftRecords, setLeftRecords] = useState(null);
  const [cellCount, setCellCount] = useState(null);
  // keep-previous: a gene change keeps the old coloring (and ITS label) on
  // screen until the new expression arrives, so the row never blanks mid-scroll
  const [shown, setShown] = useState(null);
  const [pending, setPending] = useState(false);
  // A failed fetch is reported inside the row rather than thrown to the page
  // error boundary: rows re-fetch on every scroll pass now, and one flaky
  // response must not replace the whole panel (options, gene sets, all rows)
  // with an unrecoverable alert. `attempt` re-runs both effects on Retry. The
  // alert renders INSIDE SamplePairRow so the element carrying the viewport
  // ref never changes type — swapping it would detach the observers and strand
  // the row at near=false, leaving Retry with nothing to re-run.
  // The two fetches carry SEPARATE errors: they share a row but not a fate, and
  // a single slot let the slower one's success erase the other's failure —
  // leaving the row with no alert, no Retry and a plot that never arrives.
  const [cellsError, setCellsError] = useState(null);
  const [featureError, setFeatureError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  // the label these records were fetched under, captured at resolve time so a
  // label-only change (same genes under a new set name) does not re-run the
  // effect; it is only read while a newer fetch is in flight
  const labelRef = useRef(currentLabel);
  useEffect(() => {
    labelRef.current = currentLabel; // committed renders only, never mid-render
  });
  // The row's own cells, handed to the feature fetch so it never re-derives
  // them from the cells cache. Held in a ref rather than read from state: as a
  // dependency it would re-run the effect on the one null -> array transition
  // every row makes, issuing a second identical expression query and
  // discarding the first. On a row's first pass this is still null, and the
  // fetch falls back to the cells cache — where the row's own request is
  // already in flight under the same key, so the two share one query.
  const cellsRef = useRef(null);
  useEffect(() => {
    cellsRef.current = leftRecords;
  }, [leftRecords]);

  useEffect(() => {
    if (!near) {
      setLeftRecords(null);
      setCellsError(null); // scrolled away: drop the alert, the placeholder
      return; //              speaks for the row until it is re-fetched
    }
    let live = true;
    state.fetchSampleCells(sample).then(
      (records) => {
        if (!live) return;
        setLeftRecords(records);
        setCellCount(records.length);
        setCellsError(null);
      },
      (err) => {
        if (!live) return;
        setCellCount(null); // a stale n= would outlive the data it counted
        setCellsError(err);
      },
    );
    return () => {
      live = false;
    };
  }, [state, near, sample, attempt]);

  useEffect(() => {
    if (!near) {
      setShown(null);
      setPending(false);
      setFeatureError(null);
      return;
    }
    let live = true;
    setPending(true);
    state.fetchSampleFeature(sample, genesKey, cellsRef.current).then(
      (records) => {
        if (!live) return;
        setShown({ records, label: labelRef.current, genesKey });
        setPending(false);
        setFeatureError(null);
      },
      (err) => {
        if (!live) return;
        setPending(false); // or the header spinner outlives the failure
        // Drop the kept-previous records too. They belong to the OLD gene, so
        // leaving them up would show that gene's points under its own label
        // with no sign anything failed, and `updating` — which compares
        // shown.genesKey to the requested one — would spin forever. Clearing
        // them lets the right column report the error and offer Retry.
        setShown(null);
        setFeatureError(err);
      },
    );
    return () => {
      live = false;
    };
  }, [state, near, sample, genesKey, attempt]);

  const rightRecords = shown?.records ?? null;
  // Compare the key the shown records were FETCHED under, not `pending`:
  // `pending` is set inside an effect, which runs after paint, so the render
  // that a gene change triggers would otherwise paint one frame of the new
  // gene's label over the previous gene's data — and re-derive the traces
  // three times per change instead of once.
  const updating = !!shown && (pending || shown.genesKey !== genesKey);
  // while a new gene's expression is in flight the row still shows the OLD
  // records, so it must show the label they were fetched under; otherwise the
  // records match the current selection, and reading currentLabel directly
  // keeps a label-only change (same genes under a new set name) in sync
  const featureLabel = updating ? shown.label : currentLabel;

  // expression range across this row only (per-row colorbar scale)
  const [cmin, cmax] = useMemo(() => {
    if (!rightRecords?.length) return [null, null];
    let min = Infinity;
    let max = -Infinity;
    for (const r of rightRecords) {
      if (r.__value < min) min = r.__value;
      if (r.__value > max) max = r.__value;
    }
    return [min, max];
  }, [rightRecords]);


  return (
    <SamplePairRow
      innerRef={ref}
      near={near}
      sample={sample}
      leftRecords={leftRecords}
      cellCount={cellCount}
      rightRecords={rightRecords}
      size={size}
      opacity={opacity}
      featureLabel={featureLabel}
      samplesLabel={samplesLabel}
      updating={updating}
      cmin={cmin}
      cmax={cmax}
      freeZoom={freeZoom}
      cellsError={cellsError}
      featureError={featureError}
      onRetry={() => {
        setCellsError(null);
        setFeatureError(null);
        setAttempt((n) => n + 1);
      }}
    />
  );
}

function PerSamplePlots() {
  const state = useSpatialCohort();
  const { config } = state;
  const { activeFeature, samples } = useRecoilValue(state.plotOptionsState);
  const allSamples = useRecoilValue(state.samplesQuery);
  const currentLabel = featureLabelOf(activeFeature);
  const genesKey = activeFeature.genes.join(",");

  const sampleSet = samples == null ? null : new Set(samples);
  const sampleIds = allSamples
    .filter((s) => !sampleSet || sampleSet.has(s))
    .sort();
  const samplesLabel =
    samples == null
      ? `All samples (${allSamples.length})`
      : `${sampleIds.length} of ${allSamples.length} samples`;

  return (
    <div>
      <PlotsHeader
        title={config.title}
        featureLabel={currentLabel}
        subtitle={`${sampleIds.length} sample${sampleIds.length === 1 ? "" : "s"}`}
      />
      {sampleIds.map((sample) => (
        <PerSampleRow
          key={sample}
          sample={sample}
          samplesLabel={samplesLabel}
          currentLabel={currentLabel}
          genesKey={genesKey}
        />
      ))}
    </div>
  );
}

export default function SpatialCohortPlots() {
  const { config } = useSpatialCohort();
  return config.fetch === "perSample" ? <PerSamplePlots /> : <FullFetchPlots />;
}
