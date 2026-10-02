import { useMemo, useRef } from "react";

// Toolbar icons for the two zoom tools, in the style of Plotly's own toolbar.
// Square Zoom is Plotly's stock Zoom icon unchanged (the magnifier with a
// square in its lens — the `zoombox` icon from plotly.js, MIT licensed), so
// the tool people already know keeps its look. Rectangle Zoom is the same
// magnifier with the square redrawn as a wide rectangle. Both use the icon
// font's 1000-unit, y-up coordinates, hence the flip in `transform`.
const MAGNIFIER =
  "m1000-25l-250 251c40 63 63 138 63 218 0 224-182 406-407 406-224 0-406-182-406-406s183-406 407-406c80 0 155 22 218 62l250-250 125 125z";
const SQUARE_ZOOM_ICON = {
  width: 1000,
  height: 1000,
  path: `${MAGNIFIER} m-812 250l0 438 437 0 0-438-437 0z m62 375l313 0 0-312-313 0 0 312z`,
  transform: "matrix(1 0 0 -1 0 850)",
};
const RECTANGLE_ZOOM_ICON = {
  width: 1000,
  height: 1000,
  path: `${MAGNIFIER} m-844 344l0 250 500 0 0-250-500 0z m62 188l376 0 0-126-376 0 0 126z`,
  transform: "matrix(1 0 0 -1 0 850)",
};

// The toolbar's icon colors, for a figure's `layout.modebar` — darker than
// Plotly's stock pair (the same grey at 0.3 and 0.7), which read as washed
// out. `activecolor` is also the hover color.
export const MODEBAR_COLORS = {
  color: "rgba(68, 68, 68, 0.55)",
  activecolor: "rgba(68, 68, 68, 0.95)",
};

// The figure's `config`, the same on every cohort page but for the name a
// downloaded image is saved under.
export function toolbarConfig({ filename, modeBarButtons }) {
  return {
    displayModeBar: true,
    displaylogo: false,
    // double-click returns to the square resting view; autoscale (left out
    // of the toolbar too) would fit the axes to the data instead, reshaping
    // the frame to the data's outline
    doubleClick: "reset",
    modeBarButtons,
    // the lasso here ZOOMS to the drawn region (isolating its cells), so the
    // toolbar names it accordingly — the locale dictionary is how Plotly
    // retitles a stock modebar button
    locale: "en",
    locales: { en: { dictionary: { "Lasso Select": "Lasso zoom" } } },
    // No width or height: the image is the figure as drawn. The plots are
    // laid out as pixel squares FOR the size they are on screen, so an image
    // forced to another shape would stretch them. `scale` makes up the
    // resolution.
    toImageButtonOptions: { format: "svg", filename, scale: 2 },
  };
}

// Plotly builds its toolbar out of bare <a> elements: no href, no tabindex,
// no role — a mouse can press them, a keyboard cannot reach them. This gives
// every button on a figure's toolbar a tab stop, a button role, its tooltip
// as its name, and Enter / Space to press it. Plotly rebuilds the toolbar as
// it likes, so this runs after each draw; a button already done is skipped.
export function makeToolbarOperable(graphDiv) {
  for (const button of graphDiv.querySelectorAll(".modebar-btn")) {
    if (button.dataset.operable) continue;
    button.dataset.operable = "true";
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    const title = button.getAttribute("data-title");
    if (title) button.setAttribute("aria-label", title);
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault(); // Space would scroll the page
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }
}

export const SQUARE_ZOOM = "Square Zoom";
export const RECTANGLE_ZOOM = "Rectangle Zoom";

// The plots' toolbar, with Plotly's single Zoom tool replaced by two: Square
// Zoom draws its box square, Rectangle Zoom draws any rectangle. Returned in
// the shape of Plotly's `modeBarButtons` config — the whole bar, group by
// group, stock buttons by name.
//
// `onZoomMode(rectangle)` is called when either tool is picked.
//
// The returned array is the SAME array for the life of the component, and
// that is load-bearing: Plotly compares configs by identity wherever it finds
// a function or a nested array, and a config it takes to have changed makes
// it rebuild the figure from scratch — dropping the view, the selection, and
// (for WebGL) the context — on every render. So the handler is reached
// through a ref instead of being closed over.
export function useZoomModeBar(onZoomMode) {
  const handler = useRef(onZoomMode);
  handler.current = onZoomMode;
  return useMemo(
    () => [
      ["toImage"],
      [
        {
          name: "squareZoom",
          title: SQUARE_ZOOM,
          icon: SQUARE_ZOOM_ICON,
          click: () => handler.current(false),
        },
        {
          name: "rectangleZoom",
          title: RECTANGLE_ZOOM,
          icon: RECTANGLE_ZOOM_ICON,
          click: () => handler.current(true),
        },
        "pan2d",
        "lasso2d",
      ],
      // no autoscale: it fits the axes to the data, reshaping the square frame
      ["zoomIn2d", "zoomOut2d", "resetScale2d"],
    ],
    [],
  );
}

// What marks which zoom tool is live, as props for the wrapper AROUND a
// figure (never the figure's own element: Plotly keeps classes of its own
// there, and a changing className would overwrite them). Plotly highlights
// its stock tools by itself; it cannot tell these two apart, since both are
// the same drag mode to it, so the stylesheet lights the right one instead —
// in the toolbar's own active color, handed over as a custom property.
export function zoomModeProps(dragmode, rectangle) {
  let live = "";
  if (dragmode === "zoom") {
    live = rectangle ? "zoom-mode-rectangle" : "zoom-mode-square";
  }
  return {
    className: `position-relative ${live}`.trim(),
    style: { "--modebar-active-color": MODEBAR_COLORS.activecolor },
  };
}
