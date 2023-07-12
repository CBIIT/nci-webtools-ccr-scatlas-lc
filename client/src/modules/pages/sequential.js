import TumorCell from "../tumor-cell/tumor-cell";
import TCell from "../t-cell/t-cell";
import { Container, Tabs, Tab } from "react-bootstrap";

export default function Sequential() {

    return (
        <Container className="py-3">
             <h1 className="text-primary h3 mt-2">Sequential NCI-Clarity</h1>
            <hr/>
            <Tabs
                defaultActiveKey="tumorCell"
                className="mb-3"
            >
                <Tab eventKey="tumorCell" title="Tumor Cell Community">
                    <TumorCell/>
                </Tab>
                <Tab eventKey="tCell" title="T-Cell">
                    <TCell/>
                </Tab>
            </Tabs>
        </Container>
    )
}