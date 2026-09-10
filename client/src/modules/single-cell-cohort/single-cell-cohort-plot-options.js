import { useState } from "react";
import { useRecoilState } from "recoil";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import SingleCellCohortGenePicker from "./single-cell-cohort-gene-picker";
import { useSingleCellCohort } from "./single-cell-cohort-context";

// Plot controls for a single-cell cohort's panels: Cell Size / Cell Opacity
// (defaults 4 / 0.8), the gene search, and Reset. Reset restores the cohort's
// defaults including its default gene — the × on the gene box is the one that
// clears to the cell-type view.
export default function SingleCellCohortPlotOptions() {
  const { plotOptionsState, defaultPlotOptions } = useSingleCellCohort();
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const [formValues, setFormValues] = useState(plotOptions);
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
    <form className="row" onReset={handleReset}>
      <Col md={3}>
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
      <Col md={3}>
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
      <Col md={3}>
        <SingleCellCohortGenePicker />
      </Col>
      <Col md={3}>
        <Form.Group>
          <Form.Label className="d-none d-md-block">&zwj;</Form.Label>
          <InputGroup>
            <Button variant="primary" type="reset">
              Reset
            </Button>
          </InputGroup>
        </Form.Group>
      </Col>
    </form>
  );
}
