import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Loader from "../components/loader";
import ErrorBoundary from "../components/error-boundary";
import MultiRegionalCellPlots from "./multi-regional-plots";
import MultiRegionalCellPlotOptions from "./multi-regional-plot-options";
import MultiRegionalCellCounts from "./multi-regional-counts";

export default function MultiRegionalCell() {
  return (
    <Container>
      <Card className="shadow mb-4">
        <Card.Body className="position-relative" style={{ minHeight: "800px" }}>
          <ErrorBoundary
            fallback={
              <Alert variant="danger">
                An internal error prevented plots from loading. Please contact
                the website administrator if this problem persists.
              </Alert>
            }>
            <Suspense fallback={<Loader message="Loading Plots" />}>
              <MultiRegionalCellPlotOptions />
              <hr />
              <MultiRegionalCellPlots />
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
              <MultiRegionalCellCounts />
            </Suspense>
          </ErrorBoundary>
        </Card.Body>
      </Card>
    </Container>
  );
}
