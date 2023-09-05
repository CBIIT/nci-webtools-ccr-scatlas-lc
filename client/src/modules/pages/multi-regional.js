import MultiRegionalCell from "../multi-regional/multi-regional";

import { Container } from "react-bootstrap";

export default function MultiRegional() {

    return (
        <Container className="py-3">
            <h1 className="text-primary h3 mt-2">Multi-Regional</h1>
            <hr />
            <MultiRegionalCell />
        </Container>
    )
}