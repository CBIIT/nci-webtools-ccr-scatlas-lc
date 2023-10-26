import SequentialCell from "../sequential/sequential";

import { Container } from "react-bootstrap";

export default function Sequential() {
  return (
    <Container className="py-3">
      <h1 className="text-primary h3 mt-2">SEQUENTIAL NCI-CLARITY</h1>
      <hr />
      <SequentialCell />
    </Container>
  );
}
