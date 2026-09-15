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
