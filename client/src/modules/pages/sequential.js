import SequentialCohort from "../single-cell-cohort/cohorts/sequential";

import { Container } from "react-bootstrap";

export default function Sequential() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">Sequential NCI-CLARITY</h1>
      <hr />
      <SequentialCohort />
    </Container>
  );
}
