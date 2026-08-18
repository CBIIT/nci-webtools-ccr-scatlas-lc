import { useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Plot from "react-plotly.js";
import merge from "lodash/merge";
import groupBy from "lodash/groupBy";
import { getTraces } from "../../services/plot";
import { plotOptionsState, featureExpressionQuery } from "./tiger-lc.state";

// Colors for the four cell types, in getTraces' sorted (alphabetical) group order:
// Epithelial, Immune, Malignant, Stromal.
const cellTypeColors = ["#3A5FCD", "#FF8C00", "#EE2C2C", "#32CD32"];

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
// expression (single gene, or mean of a set/subset). Spatial x/y are real
// slide millimetres — equal aspect (scaleanchor) so the tissue isn't distorted.
function SamplePairRow({
  sample,
  records,
  size,
  opacity,
  featureLabel,
  cmin,
  cmax,
  uirevision,
}) {
  const [ref, near] = useNearViewport();
  // shared view for the pair: zoom/pan/reset on either plot mirrors to the
  // other (bidirectional sync per the 7/7 client-review minutes). null = auto.
  const [viewRange, setViewRange] = useState(null);

  function handleRelayout(event) {
    if (event["xaxis.autorange"] || event["yaxis.autorange"]) {
      setViewRange(null); // double-click / reset-axes on one resets both
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

  const axes = {
    xaxis: {
      title: { text: "Spatial X (mm)", font: { size: 11 } },
      zeroline: false,
      scaleanchor: "y",
      scaleratio: 1,
      constrain: "domain",
      ...(viewRange?.x && { range: [...viewRange.x], autorange: false }),
    },
    yaxis: {
      title: { text: "Spatial Y (mm)", font: { size: 11 } },
      zeroline: false,
      ...(viewRange?.y && { range: [...viewRange.y], autorange: false }),
    },
    margin: { t: 36, r: 10, b: 40, l: 50 },
    hovermode: "closest",
    uirevision,
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

  return (
    <div ref={ref} style={{ minHeight: ROW_MIN_HEIGHT }} className="mb-3">
      <h3 className="h6 mb-1">
        {sample} <span className="text-muted fw-normal">(n={records.length})</span>
      </h3>
      {near ? (
        <Row className="g-2">
          <Col xl={6}>
            <Plot
              data={getTraces(
                records,
                {
                  // SVG scatter, not scattergl: a sample is only ~2k points,
                  // and WebGL contexts are browser-capped (~8-16) — with many
                  // mounted rows the older canvases were silently evicted and
                  // went blank
                  type: "scatter",
                  showlegend: true,
                  hovertemplate:
                    "Cell ID: %{customdata}<br>Cell type: %{fullData.name}<extra></extra>",
                  hoverlabel: { namelength: -1 },
                  marker: { size, opacity, showscale: false },
                },
                null,
                cellTypeColors,
              )}
              layout={merge({}, axes, {
                title: { text: "Cell type", font: { size: 13 } },
                legend: { itemsizing: "constant", itemwidth: 30, font: { size: 10 } },
              })}
              config={config}
              onRelayout={handleRelayout}
              useResizeHandler
              className="w-100"
              style={{ height: `${PLOT_HEIGHT}px` }}
            />
          </Col>
          <Col xl={6}>
            <Plot
              data={getTraces(
                records,
                {
                  type: "scatter", // SVG — see the cell-type plot's note
                  showlegend: false,
                  hovertemplate: `Cell ID: %{customdata}<br>${featureLabel}: %{text}<extra></extra>`,
                  hoverlabel: { namelength: -1 },
                  // fixed global scale so expression color is comparable
                  // across all sample rows
                  marker: {
                    size,
                    opacity,
                    cmin,
                    cmax,
                    colorbar: { thickness: 12, tickfont: { size: 9 } },
                  },
                },
                "__value",
              )}
              layout={merge({}, axes, {
                title: { text: featureLabel, font: { size: 13 } },
              })}
              config={config}
              onRelayout={handleRelayout}
              useResizeHandler
              className="w-100"
              style={{ height: `${PLOT_HEIGHT}px` }}
            />
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
  const { size, opacity, activeFeature, samples } =
    useRecoilValue(plotOptionsState);
  // activeFeature is never null (EPCAM default; clearing snaps back to it)
  const genesKey = activeFeature.genes.join(",");
  const featureRecords = useRecoilValue(featureExpressionQuery(genesKey));

  // samples: null = all; otherwise keep only the selected samples' rows
  const sampleSet = samples == null ? null : new Set(samples);
  const records = sampleSet
    ? featureRecords.filter((r) => sampleSet.has(r.sample))
    : featureRecords;
  const bySample = groupBy(records, "sample");
  const sampleIds = Object.keys(bySample).sort();

  // global expression range across every shown sample (fixed colorbar scale)
  let cmin = Infinity;
  let cmax = -Infinity;
  for (const r of records) {
    if (r.__value < cmin) cmin = r.__value;
    if (r.__value > cmax) cmax = r.__value;
  }

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
  const featureLabel = isSet ? setLabel() : activeFeature.label;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-baseline mb-2">
        <h2 className="h5 mb-0">
          TIGER-LC iCCA <span className="text-muted fw-normal">— {featureLabel}</span>
        </h2>
        <span className="text-muted small">
          {sampleIds.length} sample{sampleIds.length === 1 ? "" : "s"},{" "}
          n={records.length}
        </span>
      </div>
      {sampleIds.map((sample) => (
        <SamplePairRow
          key={sample}
          sample={sample}
          records={bySample[sample]}
          size={size}
          opacity={opacity}
          featureLabel={featureLabel}
          cmin={cmin}
          cmax={cmax}
          uirevision={genesKey}
        />
      ))}
    </div>
  );
}
