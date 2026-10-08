// Pure planar geometry helpers for plot selections.
//
// The single-cell tables carry no cell_id, so a lasso selection cannot be
// remembered as a set of ids the way the spatial pages do — it is remembered
// as the drawn outline itself, and membership is recomputed from coordinates
// whenever the records backing a plot change (x/y are stable per cell across
// queries; row order is not).

// Ray-casting containment test. polygon is { x: [...], y: [...] } describing
// the outline's vertices in order (an open ring — the closing edge back to
// the first vertex is implied).
export function pointInPolygon(x, y, polygon) {
  const { x: px, y: py } = polygon;
  let inside = false;
  for (let i = 0, j = px.length - 1; i < px.length; j = i++) {
    if (
      (py[i] > y) !== (py[j] > y) &&
      x < ((px[j] - px[i]) * (y - py[i])) / (py[j] - py[i]) + px[i]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

// The outline's bounding box, in the { x: [min,max], y: [min,max] } shape the
// plot view-range state uses.
export function polygonBounds(polygon) {
  return {
    x: [Math.min(...polygon.x), Math.max(...polygon.x)],
    y: [Math.min(...polygon.y), Math.max(...polygon.y)],
  };
}

// The extent of a set of records' coordinates, in the same
// { x: [min,max], y: [min,max] } shape; null when there is nothing to measure.
// A plain loop: spreading a few hundred thousand values into Math.min
// overflows the call stack.
export function recordBounds(records) {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const r of records ?? []) {
    if (!Number.isFinite(r.x) || !Number.isFinite(r.y)) continue;
    if (r.x < x0) x0 = r.x;
    if (r.x > x1) x1 = r.x;
    if (r.y < y0) y0 = r.y;
    if (r.y > y1) y1 = r.y;
  }
  return x0 <= x1 && y0 <= y1 ? { x: [x0, x1], y: [y0, y1] } : null;
}

// Grow the shorter side of a view so both axes span the same distance, each
// staying centered on its own midpoint — with the axes locked 1:1 that makes
// the plot area a square whatever the shape of the data. `pad` widens the
// common span by that fraction, keeping edge markers off the frame.
export function squareBounds(bounds, pad = 0) {
  if (!bounds?.x || !bounds?.y) return null;
  const sx = spanOf(bounds.x);
  const sy = spanOf(bounds.y);
  const larger = Math.max(sx, sy);
  // already square: hand the same ranges back untouched, so a view that only
  // moved (a pan) isn't nudged by rounding
  if (!pad && Math.abs(sx - sy) <= larger * 1e-9) return bounds;
  const span = larger * (1 + pad) || 1;
  return { x: resized(bounds.x, span), y: resized(bounds.y, span) };
}

const spanOf = ([a, b]) => Math.abs(b - a);

// Whether a view's two spans match to within `tolerance` (a fraction of the
// larger one). The default is loose enough to call a hand-drawn box that is
// square to the eye a square.
export function isSquare(bounds, tolerance = 0.01) {
  const sx = spanOf(bounds.x);
  const sy = spanOf(bounds.y);
  return Math.abs(sx - sy) <= Math.max(sx, sy) * tolerance;
}

// The range re-cut to `span` around its own midpoint; a reversed axis
// (a > b) stays reversed.
function resized([a, b], span) {
  const mid = (a + b) / 2;
  return a <= b
    ? [mid - span / 2, mid + span / 2]
    : [mid + span / 2, mid - span / 2];
}

// Fit a view change reported by the plot to a square. `next` holds the ranges
// the gesture changed (a member is null when that axis wasn't touched);
// `current` is the view it was made from. A change on both axes becomes the
// smallest square containing the drawn box. A change on ONE axis (a box
// dragged along a single direction, or an axis end pulled) sets the zoom
// level by itself: the untouched axis takes the same span around its current
// midpoint — widening to the larger span there would undo the zoom.
export function squareView(next, current) {
  if (next.x && next.y) return squareBounds(next);
  const moved = next.x ?? next.y;
  const held = next.x ? current?.y : current?.x;
  if (!moved || !held) return { x: next.x ?? null, y: next.y ?? null };
  const other = resized(held, spanOf(moved));
  return next.x ? { x: moved, y: other } : { x: other, y: moved };
}

// An axis domain cut to `fraction` of the plot area, centered in the `cell`
// ([from, to], itself in plot-area fractions) it is laid out in.
export function centeredDomain(cell, fraction) {
  const mid = (cell[0] + cell[1]) / 2;
  return [Math.max(0, mid - fraction / 2), Math.min(1, mid + fraction / 2)];
}
