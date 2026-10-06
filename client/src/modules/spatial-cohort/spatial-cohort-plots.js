import { useEffect, useMemo, useRef, useState } from "react";
import {
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
} from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Plot from "react-plotly.js";
import groupBy from "lodash/groupBy";
import { colorRange, getTraces } from "../../services/plot";
import {
  centeredDomain,
  polygonBounds,
  recordBounds,
  squareBounds,
  squareView,
} from "../../services/geometry";
import { isDrawnRectangle, relayoutView } from "../../services/plot-view";
import {
  useElementWidth,
  usePlotArea,
  usePlotAreaPress,
} from "../components/use-plot-area";
import {
  MODEBAR_COLORS,
  makeToolbarOperable,
  toolbarConfig,
  useZoomModeBar,
  zoomModeProps,
} from "../components/zoom-mode-bar";
import { featureNoun } from "../components/feature-noun";
import { useSpatialCohort } from "./spatial-cohort-context";
import SpatialCohortPlotOptions from "./spatial-cohort-plot-options";
import SpatialCohortGenePicker from "./spatial-cohort-gene-picker";
import SpatialCohortGeneSets from "./spatial-cohort-gene-sets";

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

// Apply the lassoed cell ids to a trace list — shared by both plots of a
// pair (membership is by cell id, so the re-axed right traces filter
// identically). The applied lasso REMOVES outside cells from the traces
// rather than styling them invisible: a styled-out cell still participates
// in the next draw's selection styling, so a second lasso rendered
// everything outside the new path blank instead of dimmed. Filtering per
// TRACE keeps the trace list, names, and color assignment stable (an
// emptied type keeps its legend entry). The dim style below is therefore
// all a drag ever shows: outside the in-progress path dims, inside stays
// lit — on the first draw and every one after.
//
// With no lasso active, selectedpoints is EXPLICITLY nulled: the plot the
// user drew on keeps an internal selection of its own, and only an explicit
// null clears it. With one applied, every surviving point is explicitly
// selected — the drawn outline persists as a live selection context, under
// which a null would read as "nothing selected" and dim the whole figure.
function withLasso(traces, lassoCells, opacity) {
  if (!lassoCells)
    return traces.map((trace) => ({
      ...trace,
      selectedpoints: null,
      unselected: { marker: { opacity: opacity * 0.2 } },
    }));
  return traces.map((trace) => {
    const keep = [];
    for (let i = 0; i < trace.customdata.length; i++) {
      if (lassoCells.has(trace.customdata[i])) keep.push(i);
    }
    return {
      ...trace,
      x: keep.map((i) => trace.x[i]),
      y: keep.map((i) => trace.y[i]),
      text: keep.map((i) => trace.text[i]),
      customdata: keep.map((i) => trace.customdata[i]),
      // per-point expression colors follow their cells; cmin/cmax are fixed
      // numbers from the full records, so the color scale doesn't re-derive
      marker: Array.isArray(trace.marker?.color)
        ? { ...trace.marker, color: keep.map((i) => trace.marker.color[i]) }
        : trace.marker,
      selectedpoints: keep.map((_, i) => i),
      unselected: { marker: { opacity: opacity * 0.2 } },
    };
  });
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

// figure heights until the row has been measured (one render)
const PLOT_HEIGHT = 340;
// stacked mode: two subplots on top of each other need roughly double the
// figure, keeping each subplot about the height it has side-by-side
const STACKED_PLOT_HEIGHT = 680;

// The pair figure's margins, and the share of its plot area each subplot's
// cell spans along the direction the pair is arranged in (the rest is the
// gap holding the legend). The top margin holds the toolbar (its bottom edge
// 32px down) and, below it, the subplot titles — which on a narrower row are
// wide enough to reach in under the centered toolbar — so everything starts
// clear of it.
const PAIR_MARGIN = { t: 58, r: 10, b: 40, l: 50 };
// stacked: the top subplot's title sits under the centered toolbar rather
// than beside it, so the plot area starts lower still
const STACKED_MARGIN_TOP = 80;
const PAIR_CELL = 0.42;
// what Plotly adds to the right margin for the expression colorbar — an
// allowance, not a measurement: the height has to be known before anything
// is drawn, so the placeholders can reserve it
const COLORBAR_ROOM = 70;
// the largest a subplot's square is drawn, and the smallest (the size the
// fixed 340px figure gave it)
const MAX_PLOT_SIDE = 560;
const MIN_PLOT_SIDE = 264;

// The figure height at which each subplot's square FILLS the width of its
// cell: the squares take all the width the row offers (up to the cap), and
// the row is as tall as that makes them. Derived from the row's width alone,
// so a row's placeholder and its plots are the same height and the page
// doesn't shift as rows mount and unmount.
function pairHeight(rowWidth, stacked) {
  if (!rowWidth) return stacked ? STACKED_PLOT_HEIGHT : PLOT_HEIGHT;
  const areaWidth = rowWidth - PAIR_MARGIN.l - PAIR_MARGIN.r - COLORBAR_ROOM;
  const clamp = (side) =>
    Math.round(Math.min(MAX_PLOT_SIDE, Math.max(MIN_PLOT_SIDE, side)));
  if (stacked) {
    // two squares and the gap between them, top to bottom
    const plotArea = Math.round(clamp(areaWidth) / PAIR_CELL);
    return plotArea + STACKED_MARGIN_TOP + PAIR_MARGIN.b;
  }
  return clamp(areaWidth * PAIR_CELL) + PAIR_MARGIN.t + PAIR_MARGIN.b;
}

// Below Bootstrap's xl breakpoint the pair's subplots stack vertically —
// side by side they get too narrow and the in-gap legend overlaps the
// expression plot. Media-query driven so it tracks live resizes.
function useStackedPair() {
  const [stacked, setStacked] = useState(
    () => window.matchMedia("(max-width: 1199.98px)").matches,
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1199.98px)");
    const onChange = () => setStacked(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return stacked;
}

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
function featureLabelOf(activeFeature, noun) {
  if (activeFeature.kind !== "set") return activeFeature.label;
  const { label, genes, setSize } = activeFeature;
  if (genes.length === 1) return `${label}: ${genes[0]}`;
  if (setSize && genes.length < setSize)
    return `${label} (mean, ${genes.length} of ${setSize} ${noun.many})`;
  return `${label} (mean, ${genes.length} ${noun.many})`;
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
  const { config, plotOptionsState } = useSpatialCohort();
  const setPlotOptions = useSetRecoilState(plotOptionsState);
  const stacked = useStackedPair();
  const rowWidth = useElementWidth(innerRef);
  const plotHeight = pairHeight(rowWidth, stacked);
  const rowMinHeight = plotHeight + 56; // plots + heading, keeps scroll stable
  // shared view for the pair: zoom/pan/reset on either plot mirrors to the
  // other (bidirectional sync per the 7/7 client-review minutes). null = auto.
  // uirevision is the (constant) sample id, so the view also survives gene
  // changes — only the coloring swaps.
  const [viewRange, setViewRange] = useState(null);
  // cell ids inside the drawn lasso — applied to BOTH plots' traces so the
  // pair consistently shows only the lassoed cells (outside cells render at
  // opacity 0). null = no lasso active, everything visible.
  const [lassoCells, setLassoCells] = useState(null);
  // The active modebar drag tool, controlled: left to Plotly's internal
  // state, the frequent layout re-renders (each lasso updates the header
  // count) reverted the chosen tool to zoom after a couple of draws. Routing
  // the choice through state makes it stick, and the replot it triggers also
  // initializes the WebGL selection overlay BEFORE the first drag.
  const [dragmode, setDragmode] = useState("zoom");
  // Square Zoom / Rectangle Zoom: picking either arms the zoom tool on THIS
  // figure; which of the two it is belongs to the page, so every figure's
  // zoom tool draws the same kind of box
  const modeBarButtons = useZoomModeBar((rectangle) => {
    setDragmode("zoom");
    setPlotOptions((options) => ({ ...options, freeZoom: rectangle }));
  });
  const noun = featureNoun(config.featureNoun);
  // bumped to make Plotly drop the view it holds and take the one it is
  // given (see handleRelayout) — it is part of the figure's uirevision
  const [viewEpoch, setViewEpoch] = useState(0);
  // whether the gesture behind a view change began on a plot area — what
  // tells a drawn zoom box from a drag on an axis or a corner of the frame
  const [takePlotAreaPress, plotAreaPressHandlers] = usePlotAreaPress();

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
    const pressedPlotArea = takePlotAreaPress();
    if (event.dragmode) setDragmode(event.dragmode);
    // both subplots share one figure and one view, whichever was dragged
    const change = relayoutView(event);
    if (change.reset) {
      setViewRange(null); // double-click / reset-axes on one resets both
      setLassoCells(null); // ...and brings all cells back
      return;
    }
    if (!change.x && !change.y) return;
    const current = {
      x: viewRange?.x ?? defaultRange?.x,
      y: viewRange?.y ?? defaultRange?.y,
    };
    // A Rectangle Zoom box shows ONLY what it enclosed: the view widens to
    // the square around the rectangle, and the cells that widening would
    // bring into frame are hidden, exactly as a lasso hides them. Drawn
    // inside an applied selection, it narrows it.
    if (
      freeZoom &&
      leftRecords &&
      isDrawnRectangle(change, current, pressedPlotArea)
    ) {
      const [x0, x1] = [...change.x].sort((a, b) => a - b);
      const [y0, y1] = [...change.y].sort((a, b) => a - b);
      const inside = new Set();
      let shown = 0;
      for (const r of leftRecords) {
        if (r.x < x0 || r.x > x1 || r.y < y0 || r.y > y1) continue;
        if (lassoCells && !lassoCells.has(r.cell_id)) continue;
        inside.add(r.cell_id);
        if (!hiddenTypes.has(r.type)) shown += 1;
      }
      // a box that caught no cells on show is ignored outright, as an empty
      // lasso is: applying it would blank the pair (cells of a type hidden
      // in the legend don't count — they aren't drawn). Plotly has already
      // moved the axes to the box, and handing it the ranges it started from
      // changes nothing it can see — a new uirevision is what makes it let
      // go of its own view and take ours.
      if (!shown) {
        setViewEpoch((epoch) => epoch + 1);
        return;
      }
      setLassoCells(inside);
    }
    // every view is a square at 1:1 — a Square Zoom box already is one; a
    // Rectangle Zoom box settles on the square around it
    setViewRange(squareView(change, current));
  }

  // Experimental (the open lasso-behavior question from the NCIATWP-10324
  // comment): the lasso acts as a free-shape ZOOM into just the drawn cells —
  // the pair zooms to the outline's bounding box and every cell OUTSIDE the
  // lasso is hidden (opacity 0) on both plots, so the view shows exactly the
  // lassoed region. Double-click resets view + visibility. The box widens on
  // its shorter side to a square, whichever zoom tool was last picked.
  function handleSelected(event) {
    if (!event) return; // deselect / programmatic clears
    const outline = event.lassoPoints ?? event.range;
    // the outline is keyed by AXIS ID: "x"/"y" from the left subplot,
    // "x2"/"y2" from the right — the coordinates are the same data space
    const ox = outline?.x ?? outline?.x2;
    const oy = outline?.y ?? outline?.y2;
    if (!ox?.length || !oy?.length) return;
    // the frame stays square: the box grows on its shorter side (the cells
    // out there are hidden by the lasso anyway)
    setViewRange(squareBounds(polygonBounds({ x: ox, y: oy })));
    setLassoCells(
      event.points?.length
        ? new Set(event.points.map((pt) => pt.customdata))
        : null,
    );
  }

  // The resting view: the sample's full extent widened to a square, so every
  // row draws the same square frame at the same 1:1 scale whatever the shape
  // of its tissue. Measured from the stable cells slice — never the filtered
  // traces — so legend toggles and lassos don't move it.
  const defaultRange = useMemo(
    () => squareBounds(recordBounds(leftRecords), 0.05),
    [leftRecords],
  );
  const rangeX = viewRange?.x ?? defaultRange?.x;
  const rangeY = viewRange?.y ?? defaultRange?.y;

  // Each subplot is laid out as a pixel SQUARE, centered in the cell the pair
  // arrangement gives it — with square ranges on a square frame the scale is
  // 1:1 by construction, which is what lets Rectangle Zoom drop the aspect
  // lock (needed to draw a free-shape box) without the frame stretching to
  // fill its cell.
  const [plotArea, plotAreaHandlers] = usePlotArea(makeToolbarOperable);
  const cells = stacked
    ? { x1: [0, 1], y1: [1 - PAIR_CELL, 1], x2: [0, 1], y2: [0, PAIR_CELL] }
    : { x1: [0, PAIR_CELL], y1: [0, 1], x2: [1 - PAIR_CELL, 1], y2: [0, 1] };
  const side =
    plotArea &&
    Math.min(
      plotArea.w * (cells.x1[1] - cells.x1[0]),
      plotArea.h * (cells.y1[1] - cells.y1[0]),
    );
  // until the first draw has been measured the lock stays on in either mode,
  // so the frame is square from the first paint
  const lockAspect = !freeZoom || !plotArea;
  // while the lock is on Plotly cuts the same centered square out of each
  // cell by itself, so the cells go in as they are — Square Zoom, the
  // default, then needs no second pass to lay out
  const domainX = (cell) =>
    lockAspect ? cell : centeredDomain(cell, side / plotArea.w);
  const domainY = (cell) =>
    lockAspect ? cell : centeredDomain(cell, side / plotArea.h);

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
      // stacked: the top subplot's x-axis title would collide with the
      // legend band below it — the bottom subplot's identical label serves
      // both (the axes are matched)
      ...axisStyle(stacked ? "" : `Spatial X (${units})`),
      // side by side on wide screens; stacked (full-width, top half) under
      // the xl breakpoint
      domain: domainX(cells.x1),
      // the aspect lock belongs to Square Zoom: while scaleanchor is active
      // Plotly constrains the zoombox DURING the drag (to a square, here),
      // so Rectangle Zoom has to drop it for a free-drawn rectangle to exist
      // at all — the square frame and ranges keep its scale at 1:1
      ...(lockAspect && {
        scaleanchor: "y",
        scaleratio: 1,
        constrain: "domain",
      }),
      ...(rangeX && { range: [...rangeX], autorange: false }),
    },
    yaxis: {
      ...axisStyle(`Spatial Y (${units})`),
      domain: domainY(cells.y1),
      // constrain "domain" (as on x): without it Plotly's constraint pass
      // WIDENS an explicit y range (a lasso bbox) to keep 1:1, showing cells
      // the header count excludes
      ...(lockAspect && { constrain: "domain" }),
      ...(rangeY && { range: [...rangeY], autorange: false }),
    },
    xaxis2: {
      ...axisStyle(`Spatial X (${units})`),
      domain: domainX(cells.x2),
      ...(stacked && { anchor: "y2" }),
      matches: "x",
    },
    yaxis2: {
      ...axisStyle(`Spatial Y (${units})`),
      domain: domainY(cells.y2),
      anchor: "x2",
      matches: "y",
    },
    // subplot titles (a figure-level title would sit over the gap); each
    // title sits over its own subplot in either arrangement
    annotations: [
      {
        text: "Cell type",
        x: stacked ? 0.5 : 0.21,
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
        text: `${noun.One} expression — ${featureLabel}`,
        x: stacked ? 0.5 : 0.79,
        y: stacked ? 0.42 : 1,
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
    // stacking legend + colorbar on the right edge; in the stacked
    // arrangement the gap is a horizontal band, so the legend flows
    // horizontally through it
    legend: stacked
      ? {
          itemsizing: "constant",
          itemwidth: 30,
          font: { size: 10 },
          orientation: "h",
          x: 0.5,
          xanchor: "center",
          y: 0.5,
          yanchor: "middle",
        }
      : {
          itemsizing: "constant",
          itemwidth: 30,
          font: { size: 10 },
          x: 0.435,
          xanchor: "left",
          y: 1,
          yanchor: "top",
        },
    margin: { ...PAIR_MARGIN, ...(stacked && { t: STACKED_MARGIN_TOP }) },
    // the figure follows its container, whose height tracks the row's width
    autosize: true,
    hovermode: "closest",
    dragmode,
    modebar: MODEBAR_COLORS,
    uirevision: `${sample}:${viewEpoch}`,
  };

  const plotConfig = toolbarConfig({
    filename: `${config.id}_${sample}`,
    modeBarButtons,
  });

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
              // NO `selected` style, deliberately: for scattergl Plotly
              // builds the selection overlay from ONLY the properties listed
              // in selected.marker, so declaring just an opacity drops the
              // colors. Undefined keeps the full base styling on selected
              // cells (withLasso owns the unselected side).
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
                // stacked: the colorbar shrinks to sit beside the lower
                // (expression) subplot instead of spanning both
                colorbar: {
                  thickness: 12,
                  tickfont: { size: 9 },
                  ...(stacked && { y: 0.21, yanchor: "middle", len: 0.42 }),
                },
              },
              // no `selected` style — see the cell-type plot's note
            },
            "__value",
          )
        : null,
    [rightRecords, size, opacity, cmin, cmax, featureLabel, config.renderer, stacked],
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
      style={{ height: plotHeight }}>
      <Spinner animation="border" size="sm" className="me-2" />
      <span className="small">{message}</span>
    </div>
  );

  return (
    // pt-3: keeps the sample title off the divider above it (the sticky
    // bar's for the first row, the previous row's for the rest)
    <div ref={innerRef} style={{ minHeight: rowMinHeight }} className="mb-3 pt-3">
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
        // drawn once the row's width is known, at its real height
        leftShown && rowWidth ? (
          <div
            {...zoomModeProps(dragmode, freeZoom)}
            {...plotAreaPressHandlers}>
            <Plot
              key={plotEpoch}
              data={pairData}
              layout={pairLayout}
              config={plotConfig}
              {...plotAreaHandlers}
              onRelayout={handleRelayout}
              onSelected={handleSelected}
              onDeselect={() => setLassoCells(null)}
              onLegendClick={handleLegendClick}
              onLegendDoubleClick={handleLegendDoubleClick}
              useResizeHandler
              className="w-100 spatial-pair"
              style={{ height: `${plotHeight}px` }}
            />
            {/* the right (stacked: lower) subplot has no traces while a
                row's expression loads — overlay a spinner on that region
                (Plotly cannot animate in-figure); gene CHANGES keep the
                previous coloring up, so this only shows on a row's first
                expression fetch */}
            {!rightShown && !featureError && (
              <div
                className="position-absolute d-flex align-items-center justify-content-center text-muted"
                style={
                  stacked
                    ? { top: "58%", left: 0, width: "100%", height: "42%" }
                    : { top: 0, left: "58%", width: "42%", height: plotHeight }
                }>
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
          style={{ height: plotHeight }}>
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

// The sticky control bar: filters, then the cohort title/sample-count header
// — the header describes ALL the sample rows scrolling beneath it, so it
// stays pinned with the filters instead of scrolling away with the first
// rows. Rendered by the fetch-mode components (not the page) because the
// header props are live state only they have.
function StickyBar(headerProps) {
  return (
    <div className="spatial-controls-sticky">
      {/* both filter rows fill the same centered max-width wrapper so their
          edges line up */}
      <div className="spatial-controls mx-auto">
        <SpatialCohortPlotOptions />
        {/* the single Gene and the Gene Sets color the plots through the
            same activeFeature — an either/or, spelled out by the "or" */}
        <Row className="gx-5">
          {/* 1/3 + 2/3 so Gene lines up under Cell Size and the sets panel
              under Cell Opacity + Samples; "or" floats over the gutter
              between them, on the label line */}
          <Col md={4}>
            <SpatialCohortGenePicker />
          </Col>
          <Col md={8} className="position-relative">
            <span className="form-label position-absolute top-0 start-0 translate-middle-x d-none d-md-block">
              or
            </span>
            <SpatialCohortGeneSets />
          </Col>
        </Row>
      </div>
      <PlotsHeader {...headerProps} />
      {/* the bar's bottom divider — pairs with each row's, framing the rows */}
      <hr className="mb-0" />
    </div>
  );
}

// Shared plots heading: the cohort's title alone — what the expression plots
// show is named in each plot's own title. (The zoom tools are in each
// figure's toolbar.)
function PlotsHeader({ title, updating, updatingTitle, subtitle }) {
  return (
    // mt-2: a small step between the filter rows above and the title
    <div className="text-center mt-2 mb-2">
      <h2 className="h5 mb-0">
        {title}
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
  const currentLabel = featureLabelOf(
    activeFeature,
    featureNoun(config.featureNoun),
  );

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
  // each keystroke in the size/opacity inputs and every zoom-tool switch.
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
    return colorRange(min, max);
  }, [featureBySample, sampleIds]);
  const totalShown = useMemo(() => {
    let n = 0;
    for (const s of sampleIds) n += cellsBySample[s].length;
    return n;
  }, [sampleIds, cellsBySample]);

  return (
    <div>
      <StickyBar
        title={config.title}
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
    return colorRange(min, max);
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
  const currentLabel = featureLabelOf(
    activeFeature,
    featureNoun(config.featureNoun),
  );
  const genesKey = activeFeature.genes.join(",");

  const sampleSet = samples == null ? null : new Set(samples);
  const sampleIds = allSamples
    .filter((s) => !sampleSet || sampleSet.has(s))
    .sort();
  return (
    <div>
      <StickyBar
        title={config.title}
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
