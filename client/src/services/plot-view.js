import { isSquare } from "./geometry";

// Reading what a plot reports about its view. Shared by both cohort page
// factories, so a gesture means the same thing on every page.

// a pair figure's second subplot reports its own axis names; the axes are
// matched, so either name describes the one shared view
const X_AXES = ["xaxis", "xaxis2"];
const Y_AXES = ["yaxis", "yaxis2"];

// What a Plotly relayout event did to the view: { reset, x, y }.
//   reset  the view went back to where it started (double-click, the Reset
//          axes button). It arrives as autorange, or — for a figure drawn
//          with explicit ranges — as the whole starting range under one
//          `<axis>.range` key.
//   x, y   the new [from, to] of an axis a gesture changed (both ends are
//          always reported, as `range[0]` / `range[1]`), or null for an axis
//          it left alone.
export function relayoutView(event) {
  const reset = [...X_AXES, ...Y_AXES].some(
    (axis) => event[`${axis}.autorange`] || event[`${axis}.range`],
  );
  if (reset) return { reset: true, x: null, y: null };
  const changed = (axes) => {
    const axis = axes.find((a) => event[`${a}.range[0]`] !== undefined);
    if (!axis) return null;
    return [event[`${axis}.range[0]`], event[`${axis}.range[1]`]];
  };
  return { reset: false, x: changed(X_AXES), y: changed(Y_AXES) };
}

function isWithin(range, outer) {
  const [from, to] = range[0] <= range[1] ? range : [range[1], range[0]];
  const [lo, hi] = outer[0] <= outer[1] ? outer : [outer[1], outer[0]];
  const slack = (hi - lo) * 1e-9;
  return from >= lo - slack && to <= hi + slack;
}

// Whether a pointer press landed on a subplot's plot area — the surface a
// zoom box is drawn on. Plotly lays its own drag targets over a figure: this
// one across each plot area, the others along the axes and at the frame's
// corners.
export function isPlotAreaPress(event) {
  return !!event.target?.classList?.contains("nsewdrag");
}

// Whether a view change is a box drawn with Rectangle Zoom, as opposed to
// anything else that moves both axes. The event itself doesn't say, so it is
// told from where the gesture began and from its result.
//   `pressedPlotArea`  the press behind the change landed on the plot area
//          (see usePlotAreaPress). Dragging a corner of the frame moves both
//          axes too, and by unequal amounts while Rectangle Zoom has the
//          aspect lock off — dragged inward, the result reads exactly like a
//          box. Nothing was boxed there, so nothing should be hidden.
//   the result         a drawn box is not square (every other tool keeps the
//          view square, so a pan or the toolbar's zoom in/out never
//          qualifies) and it lies INSIDE the view it was drawn on.
export function isDrawnRectangle(next, current, pressedPlotArea) {
  if (!pressedPlotArea) return false;
  if (!next.x || !next.y || !current?.x || !current?.y) return false;
  if (isSquare(next)) return false;
  return isWithin(next.x, current.x) && isWithin(next.y, current.y);
}
