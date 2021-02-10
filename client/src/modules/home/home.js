import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function Home() {
    return (
        <Container className="h-100">
            <Card className="h-100 shadow rounded-0">
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <img src="images/home.svg" className="img-fluid" alt="Home Page Figure" />
                        </Col>

                        <Col md={6}>
                            <h3>About scAtlasLC</h3>
                            <p>
                                scAtlasLC (Single-cell Atlas in Liver Cancer) is a publicly available data portal of single-cell transcriptomic profiles of tumor cell communities in hepatocellular carcinoma and intrahepatic cholangiocarcinoma
                            </p>

                            <p>
                                scAtlasLC can be used to evaluate gene expression in malignant cells and various non-malignant cells in liver cancer. It can be further used to determine gene expression in different subtypes of stromal cells and immune cells.
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} >
                            CAFs, cancer-associated fbroblasts; TAMs, tumor-associated macorphages; TECs, tumor-associated endothelial cells.
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>

    );
}