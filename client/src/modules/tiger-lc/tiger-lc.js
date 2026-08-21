import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Loader from "../components/loader";
import ErrorBoundary from "../components/error-boundary";
import TigerLcPlots from "./tiger-lc-plots";
import TigerLcPlotOptions from "./tiger-lc-plot-options";
import TigerLcGeneSets from "./tiger-lc-gene-sets";
import TigerLcStatsTable from "./tiger-lc-stats-table";

// Spatial TIGER-LC cohort view: controls + a single spatial scatter of the cells,
// colored by cell type. (Gene search, sample filter, legend/hover, and a counts
// table are added in later steps.)
export default function TigerLcCell() {
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
              <TigerLcPlotOptions />
              <TigerLcGeneSets />
              <hr />
              <TigerLcPlots />
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
              <TigerLcStatsTable />
            </Suspense>
          </ErrorBoundary>
        </Card.Body>
      </Card>
    </Container>
  );
}
