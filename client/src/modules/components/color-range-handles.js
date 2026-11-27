import { useCallback, useRef, useState } from "react";

// the two handles never meet: the gradient needs some of the range to run over
const MIN_GAP = 0.02;
const KEY_STEP = 0.01;
// room to the left of the colorbar for the handles' grips
const GRIP_WIDTH = 14;

export const FULL_COLOR_SPAN = [0, 1];

// Where a figure's colorbar is drawn, relative to the element wrapping the
// figure — what the handles are laid over. Returns [box, measure]: call
// `measure` after each draw (Plotly moves the bar as margins settle and the
// figure resizes); `box` is null while the figure has no colorbar.
export function useColorbarBox(wrapperRef) {
  const [box, setBox] = useState(null);
  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    const bar = wrapper?.querySelector(".cbfills");
    if (!bar) {
      setBox(null);
      return;
    }
    const outer = wrapper.getBoundingClientRect();
    const inner = bar.getBoundingClientRect();
    if (!(inner.height > 0)) return;
    const next = {
      top: Math.round(inner.top - outer.top),
      left: Math.round(inner.left - outer.left),
      width: Math.round(inner.width),
      height: Math.round(inner.height),
    };
    setBox((prev) =>
      prev && Object.keys(next).every((k) => prev[k] === next[k]) ? prev : next,
    );
  }, [wrapperRef]);
  return [box, measure];
}

// Two draggable handles over a figure's colorbar, setting where the color
// gradient starts and ends within the value range. `span` is [lo, hi] as
// fractions of the range; `min`/`max` are the range's ends, for reading a
// handle's position out as a value. The change is reported when a handle is
// let go, not while it moves — recoloring a large sample on every pointer
// move would stall the drag. Double-clicking a handle restores the full range.
export default function ColorRangeHandles({ box, span, min, max, onChange }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(null); // { which, value } while dragging
  if (!box || min == null || max == null) return null;

  const limit = (which, value) =>
    which === 0
      ? Math.min(Math.max(0, value), span[1] - MIN_GAP)
      : Math.max(Math.min(1, value), span[0] + MIN_GAP);
  const withValue = (which, value) =>
    which === 0 ? [value, span[1]] : [span[0], value];
  const shown = drag ? withValue(drag.which, drag.value) : span;
  const valueAt = (fraction) => +(min + fraction * (max - min)).toPrecision(3);
  const fractionAt = (clientY) => {
    const track = trackRef.current.getBoundingClientRect();
    return 1 - (clientY - track.top) / track.height;
  };

  const handle = (which) => ({
    onPointerDown: (event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus();
      setDrag({ which, value: span[which] });
    },
    onPointerMove: (event) => {
      if (drag?.which !== which) return;
      setDrag({ which, value: limit(which, fractionAt(event.clientY)) });
    },
    onPointerUp: () => {
      if (drag?.which !== which) return;
      if (drag.value !== span[which]) onChange(withValue(which, drag.value));
      setDrag(null);
    },
    onPointerCancel: () => setDrag(null),
    onDoubleClick: () => onChange(FULL_COLOR_SPAN),
    onKeyDown: (event) => {
      const moves = {
        ArrowUp: span[which] + KEY_STEP,
        ArrowRight: span[which] + KEY_STEP,
        ArrowDown: span[which] - KEY_STEP,
        ArrowLeft: span[which] - KEY_STEP,
        Home: which === 0 ? 0 : span[0] + MIN_GAP,
        End: which === 0 ? span[1] - MIN_GAP : 1,
      };
      if (!(event.key in moves)) return;
      event.preventDefault();
      onChange(withValue(which, limit(which, moves[event.key])));
    },
  });

  return (
    <div
      ref={trackRef}
      className="color-range"
      style={{
        top: box.top,
        left: box.left - GRIP_WIDTH,
        width: box.width + GRIP_WIDTH,
        height: box.height,
      }}>
      {[0, 1].map((which) => (
        <div
          key={which}
          role="slider"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={which === 0 ? "Color scale minimum" : "Color scale maximum"}
          aria-valuemin={valueAt(0)}
          aria-valuemax={valueAt(1)}
          aria-valuenow={valueAt(shown[which])}
          title={`${which === 0 ? "Minimum" : "Maximum"}: ${valueAt(shown[which])} — drag to adjust, double-click to reset`}
          className={`color-range-handle${drag?.which === which ? " dragging" : ""}`}
          style={{ top: `${(1 - shown[which]) * 100}%` }}
          {...handle(which)}>
          <span className="color-range-value">{valueAt(shown[which])}</span>
        </div>
      ))}
    </div>
  );
}
