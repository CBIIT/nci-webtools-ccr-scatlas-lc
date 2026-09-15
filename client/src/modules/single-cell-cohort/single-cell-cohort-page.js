import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Loader from "../components/loader";
import ErrorBoundary from "../components/error-boundary";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { SingleCellCohortContext } from "./single-cell-cohort-context";
import SingleCellCohortPlots from "./single-cell-cohort-plots";
import SingleCellCohortPlotOptions from "./single-cell-cohort-plot-options";
import SingleCellCohortGenePicker from "./single-cell-cohort-gene-picker";
import SingleCellCohortGeneSets from "./single-cell-cohort-gene-sets";
import SingleCellCohortCounts from "./single-cell-cohort-counts";

// A single-cell cohort page: plot controls + the cohort's cluster/expression
// panels, and the per-gene counts table below. Cohorts differ only by the
// state bundle passed in (see createSingleCellCohortState).
export default function SingleCellCohortPage({ state }) {
  return (
    <SingleCellCohortContext.Provider value={state}>
      <Container>
        <Card className="shadow mb-4">
          <Card.Body
            className="position-relative"
            style={{ minHeight: "800px" }}>
            <ErrorBoundary
              fallback={
                <Alert variant="danger">
                  An internal error prevented plots from loading. Please contact
                  the website administrator if this problem persists.
                </Alert>
              }>
              <Suspense fallback={<Loader message="Loading Plots" />}>
                {/* same centered max-width block as the spatial pages, so the
                    filter rows align and the gene-set list doesn't stretch
                    across the whole card */}
                <div className="spatial-controls mx-auto">
                  <SingleCellCohortPlotOptions />
                  {/* the single Gene and the Gene Sets color the plots through
                      the same activeFeature — an either/or, spelled out by the
                      "or" between them (mirrors the spatial pages' layout) */}
                  {/* equal halves put the "or" (which floats over the gutter
                      between the columns) at the center of the filter block */}
                  <Row className="gx-5">
                    <Col md={6}>
                      <SingleCellCohortGenePicker />
                    </Col>
                    <Col md={6} className="position-relative">
                      <span className="form-label position-absolute top-0 start-0 translate-middle-x d-none d-md-block">
                        or
                      </span>
                      <SingleCellCohortGeneSets />
                    </Col>
                  </Row>
                </div>
                <hr />
                <SingleCellCohortPlots />
              </Suspense>
            </ErrorBoundary>
          </Card.Body>
        </Card>

        <Card className="shadow mb-4">
          <Card.Header className="bg-primary text-white">
            <Card.Title className="my-1">
              {state.config.countsTitle}
            </Card.Title>
          </Card.Header>
          <Card.Body
            className="p-0 position-relative"
            style={{ minHeight: "600px" }}>
            <ErrorBoundary
              fallback={
                <Alert variant="danger" className="m-3">
                  An internal error prevented cell counts from loading. Please
                  contact the website administrator if this problem persists.
                </Alert>
              }>
              <Suspense fallback={<Loader message="Loading Cell Counts" />}>
                <SingleCellCohortCounts />
              </Suspense>
            </ErrorBoundary>
          </Card.Body>
        </Card>
      </Container>
    </SingleCellCohortContext.Provider>
  );
}
