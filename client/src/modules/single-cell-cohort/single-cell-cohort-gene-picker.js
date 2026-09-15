import { useRecoilState, useRecoilValue } from "recoil";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Select from "../components/select";
import { useSingleCellCohort } from "./single-cell-cohort-context";

// Single-gene search for a single-cell cohort. Picking a gene colors the
// panels by its expression; "All genes" (or the ×) clears to the cell-type
// cluster view — unlike the spatial pages, no gene is a real state here.
// The option list is the union across the page's panels; a panel missing the
// chosen gene says so and keeps its cluster view.
export default function SingleCellCohortGenePicker() {
  const { plotOptionsState, unionGenesQuery } = useSingleCellCohort();
  const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
  const geneOptions = useRecoilValue(unionGenesQuery);
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
          onChange={(selectedGene) => {
            const activeFeature =
              !selectedGene || selectedGene === "All genes"
                ? null
                : {
                    kind: "gene",
                    label: selectedGene,
                    genes: [selectedGene],
                  };
            mergePlotOptions({ activeFeature });
          }}
          placeholder={
            plotOptions.activeFeature?.kind === "set"
              ? "Gene set active"
              : "All genes"
          }
          value={
            plotOptions.activeFeature?.kind === "gene"
              ? plotOptions.activeFeature.label
              : null
          }
        />
        {/* the clear-× only renders while a single gene is active — with a
            set coloring the plots it read as a live gene selection */}
        {plotOptions.activeFeature?.kind === "gene" && (
          <Button
            variant="light"
            className="bg-transparent border-0 right-0 position-absolute"
            title="Show all genes (cell-type view)"
            onClick={(_) => mergePlotOptions({ activeFeature: null })}>
            &times;
          </Button>
        )}
      </InputGroup>
    </Form.Group>
  );
}
