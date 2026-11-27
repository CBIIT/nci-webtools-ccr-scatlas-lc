import { useEffect, useMemo, useRef, useState } from "react";
import { isPlotAreaPress } from "../../services/plot-view";

// The pixel size of a Plotly figure's plot area — the figure minus its
// margins, INCLUDING the room Plotly reserves on its own for a legend or a
// colorbar, which is why it is read back from the drawn figure rather than
// worked out from the container's width. Axis domains are fractions of this
// area, so knowing it is what lets a subplot be laid out as a square.
//
// Returns [area, handlers]: spread `handlers` onto the figure, and `area`
// stays current as { w, h } — null until the first draw. `onDraw(graphDiv)`,
// when given, is called after each draw too.
//
// It is re-read after EVERY draw (onAfterPlot), not only after the updates
// this app asks for (onInitialized / onUpdate): Plotly also redraws on its
// own — a second pass once a legend or colorbar has claimed its margin, a
// resize — and a size read before such a pass is a size the figure no longer
// has. A frame laid out from it would be a rectangle, and would jump when the
// aspect lock next came on and corrected it.
//
// It is dropped when the figure unmounts (onPurge): the owner usually stays
// mounted — a row scrolled out of its window, a figure rebuilt after losing
// its WebGL context — and the next figure must not be laid out from the size
// of the last one, which the window may have outgrown in between.
export function usePlotArea(onDraw) {
  const [area, setArea] = useState(null);
  const figure = useRef(null);
  const drawn = useRef(onDraw);
  drawn.current = onDraw;
  const handlers = useMemo(() => {
    const read = (graphDiv) => {
      if (graphDiv) figure.current = graphDiv;
      if (!figure.current) return;
      drawn.current?.(figure.current);
      const size = figure.current._fullLayout?._size;
      if (!size) return;
      const w = Math.round(size.w);
      const h = Math.round(size.h);
      // a figure inside a hidden tab measures zero — keep the last real size
      if (!(w > 0 && h > 0)) return;
      setArea((prev) =>
        prev && prev.w === w && prev.h === h ? prev : { w, h },
      );
    };
    return {
      onInitialized: (_figure, graphDiv) => read(graphDiv),
      onUpdate: (_figure, graphDiv) => read(graphDiv),
      onAfterPlot: () => read(),
      onPurge: () => {
        figure.current = null;
        setArea(null);
      },
    };
  }, []);
  return [area, handlers];
}

// The rendered width of an element, kept current as the page resizes; null
// until it has been measured. Figure heights are derived from this rather
// than from a drawn figure, so a row's placeholder can reserve the same
// height as the plot it stands in for — and so the figure is first drawn at
// its real size, not drawn at a guess and redrawn.
export function useElementWidth(ref) {
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;
    // a hidden tab measures zero — keep the last real width
    const apply = (w) => {
      if (w > 0) setWidth((prev) => (prev === w ? prev : w));
    };
    apply(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      // Applied on the NEXT frame, never inside the observer's own delivery:
      // the width sets a height, and resizing observed content while the
      // observer is still reporting makes the browser abandon the round
      // ("ResizeObserver loop completed with undelivered notifications").
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply(w));
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref]);
  return width;
}

// Where the gesture behind a figure's view change began: on a plot area, or
// anywhere else on the figure (an axis, a corner of the frame, the toolbar).
// Plotly reports a view change as the ranges it ended on and nothing more,
// so the press that started it is noted as it happens.
//
// Returns [take, handlers]: spread `handlers` onto the wrapper AROUND the
// figure, and call `take()` once per view change — true when its press
// landed on a plot area. A press is spent by the change it led to.
//
// The handlers listen in the capture phase: Plotly handles the press on its
// own drag targets, and this must hear it whatever Plotly does with it.
export function usePlotAreaPress() {
  const onPlotArea = useRef(false);
  return useMemo(() => {
    const note = (event) => {
      onPlotArea.current = isPlotAreaPress(event);
    };
    const take = () => {
      const pressed = onPlotArea.current;
      onPlotArea.current = false;
      return pressed;
    };
    return [take, { onMouseDownCapture: note, onTouchStartCapture: note }];
  }, []);
}
