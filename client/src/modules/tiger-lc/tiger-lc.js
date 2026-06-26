import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Loader from "../components/loader";
import ErrorBoundary from "../components/error-boundary";
import TigerLcPlots from "./tiger-lc-plots";
import TigerLcPlotOptions from "./tiger-lc-plot-options";
import TigerLcGeneSets from "./tiger-lc-gene-sets";

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
    </Container>
  );
}
