import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Loader from "../components/loader";
import ErrorBoundary from "../components/error-boundary";
import { SingleCellCohortContext } from "./single-cell-cohort-context";
import SingleCellCohortPlots from "./single-cell-cohort-plots";
import SingleCellCohortPlotOptions from "./single-cell-cohort-plot-options";
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
                <SingleCellCohortPlotOptions />
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
