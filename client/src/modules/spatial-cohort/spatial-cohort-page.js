import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Loader from "../components/loader";
import ErrorBoundary from "../components/error-boundary";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { SpatialCohortContext } from "./spatial-cohort-context";
import SpatialCohortPlots from "./spatial-cohort-plots";
import SpatialCohortPlotOptions from "./spatial-cohort-plot-options";
import SpatialCohortGenePicker from "./spatial-cohort-gene-picker";
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
                {/* controls stay pinned to the viewport top while the sample
                    rows scroll beneath them */}
                <div className="spatial-controls-sticky">
                  {/* both filter rows fill the same centered max-width wrapper
                      so their edges line up */}
                  <div className="spatial-controls mx-auto">
                    <SpatialCohortPlotOptions />
                    {/* the single Gene and the Gene Sets color the plots
                        through the same activeFeature — an either/or, spelled
                        out by the "or" between them */}
                    <Row className="gx-5">
                      {/* 1/3 + 2/3 so Gene lines up under Cell Size and the
                          sets panel under Cell Opacity + Samples; "or" floats
                          over the gutter between them, on the label line */}
                      <Col md={4}>
                        <SpatialCohortGenePicker />
                      </Col>
                      <Col md={8} className="position-relative">
                        <span className="form-label position-absolute top-0 start-0 translate-middle-x d-none d-md-block">
                          or
                        </span>
                        <SpatialCohortGeneSets />
                      </Col>
                    </Row>
                  </div>
                  <hr className="mb-0" />
                </div>
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
