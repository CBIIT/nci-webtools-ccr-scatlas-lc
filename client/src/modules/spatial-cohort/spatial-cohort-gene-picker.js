import { useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Select from "../components/select";
import { useSpatialCohort } from "./spatial-cohort-context";

// Single-gene search for a spatial cohort. Picking a gene colors the plots by
// its expression; the list comes from the per-gene stats table. Rendered next
// to the Gene Sets panel with an explicit "or" — both write the same
// activeFeature, so they are mutually exclusive by construction.
export default function SpatialCohortGenePicker() {
  const { config, plotOptionsState, cellsStatsQuery, defaultPlotOptions } =
    useSpatialCohort();
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const lookup = useRecoilValue(cellsStatsQuery);
  const geneOptions = useMemo(
    () => lookup.map((e) => e.gene).sort((a, b) => a.localeCompare(b)),
    [lookup],
  );
  const mergePlotOptions = (obj) => setPlotOptions({ ...plotOptions, ...obj });

  return (
    <Form.Group controlId="plot-gene" className="mb-3">
      <Form.Label>Gene</Form.Label>
      <InputGroup className="flex-nowrap">
        <Select
          name="gene"
          label="Gene"
          className="form-control"
          options={geneOptions}
          allOption={null}
          onChange={(selectedGene) => {
            // clearing snaps back to the cohort's default gene — the
            // expression plots always have a feature
            const activeFeature = !selectedGene
              ? defaultPlotOptions.activeFeature
              : { kind: "gene", label: selectedGene, genes: [selectedGene] };
            mergePlotOptions({ activeFeature });
          }}
          placeholder={
            plotOptions.activeFeature?.kind === "set"
              ? "Gene set active"
              : "Search genes…"
          }
          value={
            plotOptions.activeFeature?.kind === "gene"
              ? plotOptions.activeFeature.label
              : null
          }
        />
        {/* the reset-× only renders while a single gene is active — with a
            set coloring the plots it read as a live gene selection */}
        {plotOptions.activeFeature?.kind === "gene" && (
          <Button
            variant="light"
            className="bg-transparent border-0 right-0 position-absolute"
            title={`Reset to the default gene (${config.defaultGene})`}
            onClick={(_) =>
              mergePlotOptions({
                activeFeature: defaultPlotOptions.activeFeature,
              })
            }>
            &times;
          </Button>
        )}
      </InputGroup>
    </Form.Group>
  );
}
