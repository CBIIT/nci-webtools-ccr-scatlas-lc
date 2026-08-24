import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Loader from "../components/loader";
import ErrorBoundary from "../components/error-boundary";
import { SpatialCohortContext } from "./spatial-cohort-context";
import SpatialCohortPlots from "./spatial-cohort-plots";
import SpatialCohortPlotOptions from "./spatial-cohort-plot-options";
import SpatialCohortGeneSets from "./spatial-cohort-gene-sets";
import SpatialCohortStatsTable from "./spatial-cohort-stats-table";

// A spatial cohort page: plot controls + gene sets + per-sample spatial scatter
// pairs, and the per-cell-type statistics table below. Cohorts differ only by
// the state bundle passed in (see createSpatialCohortState).
export default function SpatialCohortPage({ state }) {
  return (
    <SpatialCohortContext.Provider value={state}>
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
                <SpatialCohortPlotOptions />
                <SpatialCohortGeneSets />
                <hr />
                <SpatialCohortPlots />
              </Suspense>
            </ErrorBoundary>
          </Card.Body>
        </Card>

        <Card className="shadow mb-4">
          <Card.Header className="bg-primary text-white">
            <Card.Title className="my-1">Cell Counts</Card.Title>
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
                <SpatialCohortStatsTable />
              </Suspense>
            </ErrorBoundary>
          </Card.Body>
        </Card>
      </Container>
    </SpatialCohortContext.Provider>
  );
}
