import TumorCellCohort from "../single-cell-cohort/cohorts/tumor-cell";
import TCellCohort from "../single-cell-cohort/cohorts/t-cell";
import { Container, Tabs, Tab } from "react-bootstrap";

export default function NCIClarity() {

    return (
        <Container className="py-3">
            <h1 className="text-primary h3 mt-2">NCI-CLARITY</h1>
            <hr/>
            <Tabs
                defaultActiveKey="tumorCell"
                className="mb-3"
            >
                <Tab eventKey="tumorCell" title="Tumor Cell Community">
                    <TumorCellCohort/>
                </Tab>
                <Tab eventKey="tCell" title="T-Cell">
                    <TCellCohort/>
                </Tab>
            </Tabs>
        </Container>
    )
}
