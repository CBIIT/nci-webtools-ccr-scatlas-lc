import { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import { useMemo } from "react";
import Select from "../components/select";
import MultiSelect from "../components/multi-select";
import {
  plotOptionsState,
  cellsQuery,
  cellsStatsQuery,
  defaultPlotOptions,
} from "./tiger-lc.state";

// Plot controls for the TIGER-LC spatial scatter: Cell Size / Cell Opacity
// (defaults 4 / 0.8), a Samples multi-select (all selected by default), and a gene
// search. Picking a gene colors the plot by its expression; the gene list comes from
// the per-gene stats table and the sample list from the cells.
export default function TigerLcPlotOptions() {
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const [formValues, setFormValues] = useState(plotOptions);
  const lookup = useRecoilValue(cellsStatsQuery);
  const cells = useRecoilValue(cellsQuery);
  const sampleOptions = useMemo(
    () => [...new Set(cells.map((c) => c.sample))].sort(),
    [cells],
  );
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
    <Form className="row" onReset={handleReset}>
      <Col md={2}>
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
      <Col md={2}>
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
      <Col md={3}>
        <Form.Group controlId="plot-gene" className="mb-3">
          <Form.Label>Gene</Form.Label>
          <InputGroup className="flex-nowrap">
            <Select
              name="gene"
              label="Gene"
              className="form-control"
              options={lookup.map((e) => e.gene)}
              onChange={(selectedGene) => {
                const activeFeature =
                  !selectedGene || selectedGene === "All genes"
                    ? null
                    : { kind: "gene", label: selectedGene, genes: [selectedGene] };
                mergePlotOptions({ activeFeature });
              }}
              placeholder="All genes"
              value={
                plotOptions.activeFeature?.kind === "gene"
                  ? plotOptions.activeFeature.label
                  : null
              }
            />
            <Button
              variant="light"
              className="bg-transparent border-0 right-0 position-absolute"
              onClick={(_) => mergePlotOptions({ activeFeature: null })}>
              &times;
            </Button>
          </InputGroup>
        </Form.Group>
      </Col>

      <Col md={2}>
        <Form.Group>
          <Form.Label className="d-none d-md-block">&zwj;</Form.Label>
          <InputGroup>
            <Button variant="primary" type="reset">
              Reset
            </Button>
          </InputGroup>
        </Form.Group>
      </Col>
    </Form>
  );
}
