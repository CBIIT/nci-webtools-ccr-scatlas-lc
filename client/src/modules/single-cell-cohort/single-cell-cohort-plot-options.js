import { useState } from "react";
import { useRecoilState } from "recoil";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { useSingleCellCohort } from "./single-cell-cohort-context";

// Plot controls for a single-cell cohort's panels: Cell Size / Cell Opacity
// (defaults 4 / 0.8) and Reset. Reset restores the cohort's defaults
// including its default gene — the × on the gene box (rendered in the row
// below, beside the Gene Sets panel) is the one that clears to the cell-type
// view.
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

  function handleReset(event) {
    // state-only reset — the native form reset flips controls back to their
    // mount-time attribute state behind React's back (see the spatial
    // options' note)
    event.preventDefault();
    mergePlotOptions(defaultPlotOptions);
    mergeFormValues(defaultPlotOptions);
  }

  function handleBlur() {
    mergeFormValues(plotOptions);
  }

  return (
    // Size and Opacity split on the same center gutter as the Gene / Gene
    // Sets row beneath; Reset sits out of the grid at the card's right edge
    // (as on the spatial pages) so the inputs keep the full block width
    <form className="row gx-5" onReset={handleReset}>
      <Col md={6}>
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
      <Col md={6}>
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
      {/* just right of the centered filter box, level with the Gene Sets row
          — the same spot as the spatial pages (Card.Body is the positioning
          parent). w-auto: .row forces width:100% on its children, which
          would stretch this anchored box and land the button on the LEFT */}
      <div className="single-cell-reset position-absolute w-auto">
        <Button variant="primary" type="reset">
          Reset
        </Button>
      </div>
    </form>
  );
}
