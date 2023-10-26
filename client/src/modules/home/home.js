import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link } from "react-router-dom";
import { ReactComponent as HomeImage } from "./home.svg";

export default function Home() {
  return (
    <Container className="h-100">
      <Card className="h-100 shadow rounded-0">
        <Card.Body>
          <Row>
            <Col md={6}>
              <figure className="figure">
                <HomeImage className="figure-img img-fluid" />
                <figcaption className="figure-caption">
                  CAFs, cancer-associated fibroblasts; TAMs, tumor-associated
                  macrophages; TECs, tumor-associated endothelial cells.
                </figcaption>
              </figure>
            </Col>

            <Col md={6}>
              <h1 className="h3">About scAtlasLC</h1>
              <p>
                scAtlasLC (single-cell Atlas in Liver Cancer) is a publicly
                available data portal of single-cell transcriptomic profiles of
                tumor cell communities in hepatocellular carcinoma and
                intrahepatic cholangiocarcinoma.
              </p>

              <p>
                scAtlasLC can be used to evaluate gene expression in malignant
                cells and various non-malignant cells in liver cancer. It can be
                further used to determine gene expression in different subtypes
                of stromal cells and immune cells.
              </p>

              {/* <p>
                The single-cell data used for scAtlasLC can be downloaded from
                Gene Expression Omnibus:
                <a
                  href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE151530"
                  className="ms-1"
                  target="_blank"
                  rel="noopener noreferrer">
                  GSE151530
                </a>,
                <a
                  href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE189903"
                  className="ms-1"
                  target="_blank"
                  rel="noopener noreferrer">
                  GSE189903
                </a>,
                <a
                  href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE229772"
                  className="ms-1"
                  target="_blank"
                  rel="noopener noreferrer">
                  GSE229772
                </a>
              </p> */}
              <p>
                Current single-cell data used for scAtlasLC includes the
                following:
              </p>
              <ul>
                <li>
                  NCI-CLARITY (
                  <a
                    href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE151530"
                    className="ms-1"
                    target="_blank"
                    rel="noopener noreferrer">
                    GSE151530
                  </a>
                  ). This cohort includes single cell transcriptomic profiles of
                  52,789 cells derived from 46 hepatocellular carcinoma (HCC)
                  and intrahepatic cholangiocarcinoma (iCCA) biopsies of 37
                  patients.
                </li>
                <li>
                  Multi-Regional (
                  <a
                    href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE189903"
                    className="ms-1"
                    target="_blank"
                    rel="noopener noreferrer">
                    GSE189903
                  </a>
                  ). This cohort consists of 112,506 cells from four HCC
                  patients and three iCCA patients. For each tumor, single cells
                  from five separate regions, i.e., three tumor cores (T1, T2,
                  and T3), one tumor border (B) and an adjacent normal tissue
                  (N), were prepared. A total of 34 samples were included in
                  this study.
                </li>
                <li>
                  Sequential NCI-CLARITY (
                  <a
                    href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE229772"
                    className="ms-1"
                    target="_blank"
                    rel="noopener noreferrer">
                    GSE229772
                  </a>
                  ). This cohort consists of 57,567 cells from nine HCC patients
                  and two iCCA patients. Tumor biopsies were collected
                  longitudinally, with two to five samples for each patient.
                  Overall, 31 samples were collected across all patients.
                </li>
              </ul>
            </Col>
          </Row>
          <Row>
            <Col className="mb-3" xl={4}>
              <Link to="/nci-clarity" rel="noreferrer">
                <Card className="shadow" style={{ cursor: "pointer" }}>
                  <Card.Img
                    height="368px"
                    variant="top"
                    src={"/images/nci_clarity_HD.svg"}
                  />
                  <Card.Body>
                    <Card.Text className="d-flex text-center justify-content-center">
                      <div>
                        <h3>NCI-CLARITY</h3>
                        <div>52,789 cells</div>
                      </div>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            <Col className="mb-3" xl={4}>
              <Link to="/multi-regional" rel="noreferrer">
                <Card className="shadow" style={{ cursor: "pointer" }}>
                  <Card.Img
                    height="368px"
                    variant="top"
                    src={"/images/multiregional_HD.svg"}
                  />
                  <Card.Body>
                    <Card.Text className="d-flex text-center justify-content-center">
                      <div>
                        <h3>Multi-Regional</h3>
                        <div>112,506 cells</div>
                      </div>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            <Col className="mb-3" xl={4}>
              <Link to="/sequential" rel="noreferrer">
                <Card className="shadow" style={{ cursor: "pointer" }}>
                  <Card.Img
                    height="368px"
                    variant="top"
                    src={"/images/sequential_nci_clarity_HD.svg"}
                  />
                  <Card.Body>
                    <Card.Text className="d-flex text-center justify-content-center">
                      <div>
                        <h3>Sequential NCI-CLARITY</h3>
                        <div>57,567 cells</div>
                      </div>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
