import { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import MultiSelect from "../components/multi-select";
import { useSpatialCohort } from "./spatial-cohort-context";

// Plot controls for a spatial cohort's scatter pairs: Cell Size / Cell Opacity
// (defaults 4 / 0.8), a Samples multi-select (all selected by default), and
// Reset/free-zoom. The gene search lives in SpatialCohortGenePicker, laid out
// beside the Gene Sets panel. The sample list comes from samplesQuery
// (configured, or derived from the cells).
export default function SpatialCohortPlotOptions() {
  const { plotOptionsState, samplesQuery, defaultPlotOptions } =
    useSpatialCohort();
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const [formValues, setFormValues] = useState(plotOptions);
  const sampleOptions = useRecoilValue(samplesQuery);
  const mergePlotOptions = (obj) => setPlotOptions({ ...plotOptions, ...obj });
  const mergeFormValues = (obj) => setFormValues({ ...formValues, ...obj });

  function handleChange(event) {
    const { name, value, min, max, type } = event.target;
    const clampedValue =
      type === "number" ? Math.min(+max, Math.max(+min, value)) : value;
    mergePlotOptions({ [name]: clampedValue });
    mergeFormValues({ [name]: value });
  }

  function handleReset() {
    mergePlotOptions(defaultPlotOptions);
    mergeFormValues(defaultPlotOptions);
  }

  function handleBlur() {
    mergeFormValues(plotOptions);
  }

  return (
    <Form onReset={handleReset}>
      {/* gx-5: matches the Gene / Gene Sets row so the columns stay aligned */}
      <Row className="gx-5">
        <Col md={4}>
          <Form.Group controlId="cell-size" className="mb-3">
            <Form.Label>Cell Size</Form.Label>
            <Form.Control
              type="number"
              name="size"
              value={formValues.size}
              onChange={handleChange}
              onBlur={handleBlur}
              min="1"
              max="10"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="cell-opacity" className="mb-3">
            <Form.Label>Cell Opacity</Form.Label>
            <Form.Control
              type="number"
              name="opacity"
              value={formValues.opacity}
              onChange={handleChange}
              onBlur={handleBlur}
              step="0.1"
              min="0.1"
              max="1"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="plot-samples" className="mb-3">
            <Form.Label>Samples</Form.Label>
            <MultiSelect
              label="Samples"
              allLabel={`All samples (${sampleOptions.length})`}
              options={sampleOptions}
              value={plotOptions.samples}
              onChange={(samples) => mergePlotOptions({ samples })}
            />
          </Form.Group>
        </Col>
      </Row>
      {/* level with the top filter row but OUTSIDE the centered filter box, at
          the card's right edge — the sticky container is the positioning parent */}
      <div className="spatial-reset position-absolute">
        <Button variant="primary" type="reset">
          Reset
        </Button>
      </div>
    </Form>
  );
}
