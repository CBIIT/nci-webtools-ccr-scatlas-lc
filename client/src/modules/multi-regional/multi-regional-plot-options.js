import { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Select from "../components/select";
import {
  plotOptionsState,
  tumorCellsQuery,
  tumorCellsStatsQuery,
  defaultPlotOptions,
} from "./multi-regional.state";

export default function MultiRegionalCellPlotOptions() {
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const [formValues, setFormValues] = useState(plotOptions);
  const lookup = useRecoilValue(tumorCellsStatsQuery);
  const tumor = useRecoilValue(tumorCellsQuery);
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
        <Form.Group controlId="plot-gene" className="mb-3">
          <Form.Label>Gene</Form.Label>
          <InputGroup className="flex-nowrap">
            <Select
              name="gene"
              label="Gene"
              className="form-control"
              onChange={(gene) => mergePlotOptions({ gene })}
              options={lookup.map((e) => e.gene)}
              placeholder="All genes"
              value={plotOptions.gene}
            />
            <Button
              variant="light"
              className="bg-transparent border-0 right-0 position-absolute"
              onClick={(_) => mergePlotOptions({ gene: null })}>
              &times;
            </Button>
          </InputGroup>
        </Form.Group>
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
