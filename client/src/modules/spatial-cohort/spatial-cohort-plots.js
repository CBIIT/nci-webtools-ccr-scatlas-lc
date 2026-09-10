import { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilState, useRecoilValue, useRecoilValueLoadable } from "recoil";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Plot from "react-plotly.js";
import groupBy from "lodash/groupBy";
import { getTraces } from "../../services/plot";
import { useSpatialCohort } from "./spatial-cohort-context";

// THE row visibility rule, in one place: a record shows when its type is not
// legend-hidden, it is inside an applied lasso (if any), and it lies within
// the zoomed view. The display pipeline applies these same three filters as
// trace transforms (applyHidden, withLasso, viewRange-as-axis-ranges); the
// header's "n=X of Y" count MUST derive from this predicate so the number
// and the pixels can never drift apart.
function isRecordVisible(r, { hiddenTypes, lassoCells, viewRange }) {
  if (hiddenTypes && hiddenTypes.has(r.type)) return false;
  if (lassoCells && !lassoCells.has(r.cell_id)) return false;
  if (viewRange) {
    if (viewRange.x && (r.x < viewRange.x[0] || r.x > viewRange.x[1]))
      return false;
    if (viewRange.y && (r.y < viewRange.y[0] || r.y > viewRange.y[1]))
      return false;
  }
  return true;
}

// Project the lassoed cell ids onto a trace list as per-trace selectedpoints
// indices — shared by both plots of a pair (Plotly selections are otherwise
// per-plot). With no lasso active, selectedpoints is EXPLICITLY nulled: the
// plot the user drew on keeps an internal selection of its own, and only an
// explicit null clears it (autoscale/reset/deselect would otherwise leave
// that plot still filtered).
//
// The unselected style is decided here, not in the base traces: while a lasso
// is still being DRAWN Plotly already styles everything outside the path as
// unselected, so a fixed opacity 0 would blank the plot mid-draw. Until a
// selection is applied, outside cells only dim; once applied they disappear
// (the lasso-zoom effect).
function withLasso(traces, lassoCells, opacity) {
  if (!lassoCells)
    return traces.map((trace) => ({
      ...trace,
      selectedpoints: null,
      unselected: { marker: { opacity: opacity * 0.2 } },
    }));
  return traces.map((trace) => ({
    ...trace,
    unselected: { marker: { opacity: 0 } },
    selectedpoints: trace.customdata
      .map((cellId, i) => (lassoCells.has(cellId) ? i : -1))
      .filter((i) => i >= 0),
  }));
}

// how long the page must be still before a near row fetches
const SCROLL_SETTLE_MS = 150;

// A pixel margin cannot bound how many rows are mounted at once: the live band
// is viewport + 2 x unmountMargin, so a tall panel (a rotated 4K monitor is
// ~3800px) mounts twice what a laptop does. For a WebGL cohort that overruns
// the browser's ~16-context-per-page cap, and the excess plots go silently
// blank — no error, just white. Cohorts that need it therefore cap the number
// of live rows outright: rows claim a slot, and when the budget is full the
// least-recently-entered row yields — so the rows the user just scrolled to
// always render, and a row without a slot shows the same "scroll to load"
// placeholder it showed before it was reached. One budget per cohort, keyed by
// config id, since the cap is a per-page resource.
const mountBudgets = new Map();

function createMountBudget(maxLive) {
  const rows = new Map(); // id -> { el, notify }
  const claimed = new Set();
  let frame = 0;

  // Rank by distance from the viewport centre, NOT by claim order: a row only
  // claims when it enters the band, so claim order is scroll order, and on a
  // viewport tall enough to hold more than maxLive rows that hands the slots
  // to the rows FURTHEST along and blanks the ones the user is looking at.
  // On-screen rows additionally outrank ALL off-screen rows regardless of
  // distance — a slot yielded while visible is a live plot blanking in front
  // of the user, so victims come from off-screen rows whenever possible.
  const settle = () => {
    frame = 0;
    const height = window.innerHeight;
    const middle = height / 2;
    const live = new Set(
      [...claimed]
        .map((id) => {
          const el = rows.get(id)?.el;
          if (!el) return null;
          const box = el.getBoundingClientRect();
          return {
            id,
            inView: box.bottom > 0 && box.top < height,
            distance: Math.abs((box.top + box.bottom) / 2 - middle),
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.inView - a.inView || a.distance - b.distance)
        .slice(0, maxLive)
        .map((row) => row.id),
    );
    for (const [id, row] of rows) row.notify(live.has(id));
  };

  // distances go stale as the page moves, so re-rank on scroll (coalesced to
  // one measurement per frame, since getBoundingClientRect forces layout)
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(settle);
  };

  return {
    subscribe(id, el, notify) {
      if (!rows.size) {
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
      }
      rows.set(id, { el, notify });
      return () => {
        rows.delete(id);
        claimed.delete(id);
        if (!rows.size) {
          window.removeEventListener("scroll", schedule);
          window.removeEventListener("resize", schedule);
        }
      };
    },
    claim(id) {
      claimed.add(id);
      settle();
    },
    release(id) {
      if (!claimed.delete(id)) return;
      settle();
    },
  };
}

function getMountBudget(id, maxLive) {
  if (!mountBudgets.has(id)) mountBudgets.set(id, createMountBudget(maxLive));
  return mountBudgets.get(id);
}

// Narrows `near` to `near AND holding a slot`. Cohorts without a maxLiveRows
// cap (the SVG ones, which have no context budget to blow) pass through.
function useMountSlot(config, rowId, near, elementRef) {
  const maxLive = config.maxLiveRows;
  const [granted, setGranted] = useState(false);
  // Claim only once the scroll has settled: every mount is a fresh WebGL
  // context, and rapid create/destroy cycling while scrolling outruns the
  // browser's lazy context reclamation — tripping the per-page cap and
  // blanking LIVE plots. Rows the user scrolls straight past never render;
  // only rows they stop on claim a slot.
  const settled = useScrollSettled(near && !!maxLive);
  useEffect(() => {
    if (!maxLive) return;
    const budget = getMountBudget(config.id, maxLive);
    const unsubscribe = budget.subscribe(rowId, elementRef.current, setGranted);
    if (near && settled) budget.claim(rowId);
    else budget.release(rowId);
    return () => {
      budget.release(rowId);
      unsubscribe();
    };
  }, [config.id, maxLive, rowId, near, settled, elementRef]);
  return maxLive ? near && settled && granted : near;
}

// Gate per-sample fetching on the page having stopped moving. A flick down the
// cohort crosses every row's mount window, and an in-flight request cannot be
// cancelled (the LRU shares one promise between rows, so aborting for one
// would break the others). A fixed delay from when the row became near does
// not help — the near band is viewport + 2 x unmountMargin (~2100px for the
// Multi-Regional cohort on a laptop), so even a fast flick leaves each row
// inside it for several hundred milliseconds. Re-arming on every scroll event
// does: only the rows the user actually lands on issue a query.
function useScrollSettled(active, delay = SCROLL_SETTLE_MS) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!active) {
      setSettled(false);
      return;
    }
    let timer;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSettled(true);
        window.removeEventListener("scroll", arm); // settled once, then idle
      }, delay);
    };
    arm();
    window.addEventListener("scroll", arm, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", arm);
    };
  }, [active, delay]);
  return settled;
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

  // A perSample row's records are released when it leaves the mount window;
  // the lasso's cell-id Set has to go with them, or it pins up to ~330k
  // strings per lassoed row for the life of the page — the strings are
  // otherwise unreachable once the records are dropped. The view it zoomed to
  // resets with it, since showing a lasso's bounding box without its filtering
  // would misrepresent the plot; a plain drag-zoom (four numbers) is left
  // alone. Full-fetch cohorts keep their records pinned by the shared
  // cellsQuery either way, so there is nothing to release and the selection
  // must survive scrolling between samples, as it always has.
  const releasesRecords = config.fetch === "perSample";
  useEffect(() => {
    if (!releasesRecords || near || !lassoCells) return;
    setLassoCells(null);
    setViewRange(null);
  }, [releasesRecords, near, lassoCells]);

  function handleRelayout(event) {
    if (
      event["xaxis.autorange"] ||
      event["yaxis.autorange"] ||
      event["xaxis2.autorange"] ||
      event["yaxis2.autorange"]
    ) {
      setViewRange(null); // double-click / reset-axes on one resets both
      setLassoCells(null); // ...and brings all cells back
      return;
    }
    // both subplots share one figure: a drag on the right reports xaxis2/
    // yaxis2 keys, matched to the left axes — normalize to one view range
    const rx =
      event["xaxis.range[0]"] !== undefined
        ? [event["xaxis.range[0]"], event["xaxis.range[1]"]]
        : event["xaxis2.range[0]"] !== undefined
          ? [event["xaxis2.range[0]"], event["xaxis2.range[1]"]]
          : null;
    const ry =
      event["yaxis.range[0]"] !== undefined
        ? [event["yaxis.range[0]"], event["yaxis.range[1]"]]
        : event["yaxis2.range[0]"] !== undefined
          ? [event["yaxis2.range[0]"], event["yaxis2.range[1]"]]
          : null;
    if (rx || ry) {
      setViewRange((prev) => ({
        x: rx ?? prev?.x ?? null,
        y: ry ?? prev?.y ?? null,
      }));
    }
  }

  // Experimental (the open lasso-behavior question from the NCIATWP-10324
  // comment): the lasso acts as a free-shape ZOOM into just the drawn cells —
  // the pair zooms to the outline's bounding box and every cell OUTSIDE the
  // lasso is hidden (opacity 0) on both plots, so the view shows exactly the
  // lassoed region. Double-click resets view + visibility. In Proportional
  // zoom the box widens to keep 1:1; in Free zoom it is exact.
  function handleSelected(event) {
    if (!event) return; // deselect / programmatic clears
    const outline = event.lassoPoints ?? event.range;
    // the outline is keyed by AXIS ID: "x"/"y" from the left subplot,
    // "x2"/"y2" from the right — the coordinates are the same data space
    const ox = outline?.x ?? outline?.x2;
    const oy = outline?.y ?? outline?.y2;
    if (!ox?.length || !oy?.length) return;
    setViewRange({
      x: [Math.min(...ox), Math.max(...ox)],
      y: [Math.min(...oy), Math.max(...oy)],
    });
    setLassoCells(
      event.points?.length
        ? new Set(event.points.map((pt) => pt.customdata))
        : null,
    );
  }

  const units = config.units ?? "mm";
  // ONE figure holds both plots as side-by-side subplots — one WebGL context
  // per row instead of two, doubling how many rows fit under the browser's
  // context cap. The right axes `match` the left, so zoom/pan on either
  // subplot moves both natively (the old two-figure sync re-rendered through
  // React state; matching happens inside Plotly's one draw).
  const axisStyle = (title) => ({
    title: { text: title, font: { size: 11 } },
    zeroline: false,
  });
  const pairLayout = {
    xaxis: {
      ...axisStyle(`Spatial X (${units})`),
      domain: [0, 0.42],
      // aspect lock is optional (the "Enable rectangular zoom" checkbox):
      // locked keeps 1:1 so tissue isn't distorted; the lock must go the
      // moment the box is checked — while scaleanchor is active Plotly
      // constrains the zoombox DURING the drag, so the free-drawn rectangle
      // otherwise never exists to zoom into.
      ...(!freeZoom && {
        scaleanchor: "y",
        scaleratio: 1,
        constrain: "domain",
      }),
      ...(viewRange?.x && { range: [...viewRange.x], autorange: false }),
    },
    yaxis: {
      ...axisStyle(`Spatial Y (${units})`),
      // constrain "domain" (as on x): without it Plotly's constraint pass
      // WIDENS an explicit y range (a lasso bbox) to keep 1:1, showing cells
      // the header count excludes
      ...(!freeZoom && { constrain: "domain" }),
      ...(viewRange?.y && { range: [...viewRange.y], autorange: false }),
    },
    xaxis2: {
      ...axisStyle(`Spatial X (${units})`),
      domain: [0.58, 1],
      matches: "x",
    },
    yaxis2: {
      ...axisStyle(`Spatial Y (${units})`),
      anchor: "x2",
      matches: "y",
    },
    // subplot titles (a figure-level title would sit over the gap)
    annotations: [
      {
        text: "Cell type",
        x: 0.21,
        y: 1,
        xref: "paper",
        yref: "paper",
        xanchor: "center",
        yanchor: "bottom",
        showarrow: false,
        font: { size: 13 },
      },
      {
        // the active gene / gene set named in the title per client feedback
        text: `Gene expression — ${featureLabel}`,
        x: 0.79,
        y: 1,
        xref: "paper",
        yref: "paper",
        xanchor: "center",
        yanchor: "bottom",
        showarrow: false,
        font: { size: 13 },
      },
    ],
    // the legend lives in the gap between the subplots (the spot it occupied
    // when the pair was two figures), keeping the row symmetrical instead of
    // stacking legend + colorbar on the right edge
    legend: {
      itemsizing: "constant",
      itemwidth: 30,
      font: { size: 10 },
      x: 0.435,
      xanchor: "left",
      y: 1,
      yanchor: "top",
    },
    margin: { t: 36, r: 10, b: 40, l: 50 },
    hovermode: "closest",
    uirevision: sample,
  };

  const plotConfig = {
    displayModeBar: true,
    displaylogo: false,
    // the lasso here ZOOMS to the drawn region (isolating its cells), so the
    // toolbar names it accordingly — the locale dictionary is how Plotly
    // retitles a stock modebar button
    locale: "en",
    locales: { en: { dictionary: { "Lasso Select": "Lasso zoom" } } },
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
              // lasso-zoom: withLasso hides/dims outside cells via `unselected`
              selected: { marker: { opacity } },
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
              // see the cell-type plot: withLasso owns the unselected style
              selected: { marker: { opacity } },
            },
            "__value",
          )
        : null,
    [rightRecords, size, opacity, cmin, cmax, featureLabel, config.renderer],
  );

  // Cell types toggled off via the LEFT plot's legend — controlled state so
  // the RIGHT plot filters the same cells simultaneously (both plots' traces
  // are grouped per type, so visibility mirrors by trace name). Plotly's own
  // legend toggling is suppressed; this state is the single source of truth.
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());
  const applyHidden = (traces, moveColorbar) => {
    const firstVisible = traces.find((t) => !hiddenTypes.has(t.name))?.name;
    return traces.map((t) => ({
      ...t,
      visible: hiddenTypes.has(t.name) ? "legendonly" : true,
      // the expression colorbar rides on one trace — keep it on the first
      // VISIBLE one, or hiding that type would hide the scale with it
      ...(moveColorbar && {
        marker: { ...t.marker, showscale: t.name === firstVisible },
      }),
    }));
  };
  const leftShown = useMemo(
    () =>
      leftData ? applyHidden(withLasso(leftData, lassoCells, opacity)) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leftData, lassoCells, opacity, hiddenTypes],
  );
  const rightShown = useMemo(
    () =>
      rightData
        ? applyHidden(withLasso(rightData, lassoCells, opacity), true)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rightData, lassoCells, opacity, hiddenTypes],
  );

  // legend interactions on the cell-type plot drive BOTH plots: single click
  // toggles a type, double click isolates it (or restores all when it is
  // already the only one showing) — the standard Plotly gestures, reimplemented
  // so the expression plot follows
  // A figure whose WebGL context the browser reclaimed stays in the DOM but
  // draws nothing — it looks loaded and is blank forever (Plotly does not
  // restore lost contexts). Watch the row's canvas and remount the figure
  // under a fresh key when its context dies, so it rebuilds with a live one;
  // throttled so a still-starved page cannot remount-loop. No dependency
  // array: canvases appear across many renders and arming is idempotent.
  const [plotEpoch, setPlotEpoch] = useState(0);
  const lastContextLoss = useRef(0);
  const contextLossTimer = useRef(0);
  useEffect(() => {
    const rowEl = innerRef?.current;
    if (!rowEl || !near) return;
    for (const canvas of rowEl.querySelectorAll("canvas")) {
      if (canvas.dataset.lossArmed) continue;
      canvas.dataset.lossArmed = "1";
      canvas.addEventListener(
        "webglcontextlost",
        () => {
          // a loss inside the throttle window DEFERS the remount rather than
          // dropping it: the {once} listener is consumed either way, so a
          // dropped event would leave the row permanently blank with nothing
          // left to watch it
          const now = Date.now();
          const wait = Math.max(0, lastContextLoss.current + 3000 - now);
          lastContextLoss.current = now + wait;
          clearTimeout(contextLossTimer.current);
          contextLossTimer.current = setTimeout(
            () => setPlotEpoch((n) => n + 1),
            wait,
          );
        },
        { once: true },
      );
    }
  });
  useEffect(() => () => clearTimeout(contextLossTimer.current), []);

  // one figure: right-subplot traces are the same records re-axed onto x2/y2
  const pairData = useMemo(
    () =>
      leftShown
        ? [
            ...leftShown,
            ...(rightShown ?? []).map((t) => ({
              ...t,
              xaxis: "x2",
              yaxis: "y2",
            })),
          ]
        : null,
    [leftShown, rightShown],
  );

  function handleLegendClick(event) {
    const name = event.data[event.curveNumber]?.name;
    if (name == null) return false;
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    return false; // suppress Plotly's internal (left-only) toggle
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

  // Header count reflects what the plots actually show: legend-hidden types,
  // an applied lasso, and the zoomed region all narrow it. One pass per
  // interaction (zoom/lasso/legend events are discrete). The last computed
  // value is latched in a ref so an idle row — whose records are released —
  // keeps showing the filtered count it had when live.
  const countFiltersActive =
    !!lassoCells || !!viewRange || hiddenTypes.size > 0;
  // a stable fingerprint of the active filters — the latched count (below)
  // is only valid while the filters it was computed under still hold
  const filterSignature = `${lassoCells ? lassoCells.size : ""}|${
    viewRange ? JSON.stringify(viewRange) : ""
  }|${[...hiddenTypes].sort().join(",")}`;
  const filteredCount = useMemo(() => {
    if (!leftRecords) return null;
    if (!countFiltersActive) return leftRecords.length;
    let n = 0;
    const filters = { hiddenTypes, lassoCells, viewRange };
    for (const r of leftRecords) if (isRecordVisible(r, filters)) n += 1;
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftRecords, lassoCells, viewRange, hiddenTypes, countFiltersActive]);
  // Latch the last computed count so an idle row (records released) keeps its
  // number — but only while the filters still match: a perSample row's lasso
  // is cleared on leaving the band, and the stale "n=X of Y" it produced must
  // not outlive it. Written in an effect (committed renders only).
  const lastFilteredCount = useRef(null);
  useEffect(() => {
    if (filteredCount != null) {
      lastFilteredCount.current = { count: filteredCount, sig: filterSignature };
    }
  });
  const latched = lastFilteredCount.current;
  const shownCount =
    filteredCount ?? (latched?.sig === filterSignature ? latched.count : null);

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
      {/* center-aligned row header — SampleID + cell count (the gene/sample
          filter echoes 10326's AC3 asked for were dropped per client feedback;
          those selections still show in the page-level header and plot titles) */}
      <h3 className="h6 mb-1 text-center">
        {sample}
        {cellCount != null && (
          <span className="text-muted fw-normal">
            {" "}
            · n=
            {countFiltersActive && shownCount != null
              ? `${shownCount.toLocaleString()} of ${cellCount.toLocaleString()}`
              : cellCount.toLocaleString()}{" "}
            cells
          </span>
        )}
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
          <div className="position-relative">
            <Plot
              key={plotEpoch}
              data={pairData}
              layout={pairLayout}
              config={plotConfig}
              onRelayout={handleRelayout}
              onSelected={handleSelected}
              onDeselect={() => setLassoCells(null)}
              onLegendClick={handleLegendClick}
              onLegendDoubleClick={handleLegendDoubleClick}
              useResizeHandler
              className="w-100 spatial-pair"
              style={{ height: `${PLOT_HEIGHT}px` }}
            />
            {/* the right subplot has no traces while a row's expression
                loads — overlay a spinner on that half (Plotly cannot animate
                in-figure); gene CHANGES keep the previous coloring up, so
                this only shows on a row's first expression fetch */}
            {!rightShown && !featureError && (
              <div
                className="position-absolute top-0 d-flex align-items-center justify-content-center text-muted"
                style={{ left: "58%", width: "42%", height: PLOT_HEIGHT }}>
                <Spinner animation="border" size="sm" className="me-2" />
                <span className="small">Loading expression…</span>
              </div>
            )}
            {featureError && !rightShown && errorBox(featureError)}
          </div>
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
      {/* bottom divider pairs with the sticky bar's, framing each row between
          borders; outside the conditional so placeholders keep the frame.
          mt-4: the x-axis label sits flush inside the plot canvas, so the
          divider needs the larger step to read evenly spaced against the
          next row's title below it */}
      <hr className="mt-4 mb-0" />
    </div>
  );
}

// Shared plots heading: cohort title + what the expression plots show, with
// the Proportional/Free zoom radios beneath (moved out of the plot options
// row — they act on the graphs, so they live with them).
function PlotsHeader({ title, featureLabel, updating, updatingTitle, subtitle }) {
  const { config, plotOptionsState } = useSpatialCohort();
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  return (
    // mt-3: breathing room between the sticky controls' divider and the title
    <div className="text-center mt-3 mb-2">
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
      {/* centered under the title */}
      {/* the client's vocabulary for the two zoom behaviors: proportional
          keeps the square 1:1 aspect; free zooms to the exact drawn box */}
      <div className="d-flex justify-content-center gap-4">
        <Form.Check
          type="radio"
          name={`${config.id}-zoom-mode`}
          id={`${config.id}-zoom-proportional`}
          label="Proportional zoom"
          title="Zoom boxes keep the square 1:1 aspect so tissue is never stretched"
          checked={!plotOptions.freeZoom}
          onChange={() => setPlotOptions({ ...plotOptions, freeZoom: false })}
        />
        <Form.Check
          type="radio"
          name={`${config.id}-zoom-mode`}
          id={`${config.id}-zoom-free`}
          label="Free zoom"
          title="Zoom to the exact drawn rectangle without preserving the square 1:1 aspect (allows stretching)"
          checked={plotOptions.freeZoom}
          onChange={() => setPlotOptions({ ...plotOptions, freeZoom: true })}
        />
      </div>
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

  const cellsBySample = useMemo(() => groupBy(cells, "sample"), [cells]);
  const featureBySample = useMemo(
    () => (featureRecords ? groupBy(featureRecords, "sample") : null),
    [featureRecords],
  );
  // samples: null = all; otherwise keep only the selected samples' rows.
  // Memoized: these scans cover every record, and plotOptionsState commits on
  // each keystroke in the size/opacity inputs and every zoom-mode toggle.
  const sampleIds = useMemo(() => {
    const sampleSet = samples == null ? null : new Set(samples);
    return Object.keys(cellsBySample)
      .filter((s) => !sampleSet || sampleSet.has(s))
      .sort();
  }, [cellsBySample, samples]);
  // global expression range across every shown sample (fixed colorbar scale)
  const [cmin, cmax] = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    if (featureBySample) {
      for (const id of sampleIds) {
        for (const r of featureBySample[id] ?? []) {
          if (r.__value < min) min = r.__value;
          if (r.__value > max) max = r.__value;
        }
      }
    }
    return [min, max];
  }, [featureBySample, sampleIds]);
  const totalShown = useMemo(() => {
    let n = 0;
    for (const s of sampleIds) n += cellsBySample[s].length;
    return n;
  }, [sampleIds, cellsBySample]);

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
function PerSampleRow({ sample, currentLabel, genesKey }) {
  const state = useSpatialCohort();
  const { config } = state;
  const { size, opacity, freeZoom } = useRecoilValue(state.plotOptionsState);
  const [ref, nearViewport] = useNearViewport(config);
  const near = useMountSlot(config, sample, nearViewport, ref);
  const settled = useScrollSettled(near);

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
    if (!settled) return;
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
  }, [state, near, settled, sample, attempt]);

  useEffect(() => {
    if (!near) {
      setShown(null);
      setPending(false);
      setFeatureError(null);
      return;
    }
    if (!settled) return;
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
  }, [state, near, settled, sample, genesKey, attempt]);

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
