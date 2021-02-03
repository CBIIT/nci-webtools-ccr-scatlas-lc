import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function Home() {
    return (
        <Container className="py-4">
            <Card className="shadow">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-0">
                        Single-Cell Atlas in Liver Cancer (SCATLAS-LC)
                </Card.Title>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <img src="images/home.svg" className="img-fluid" alt="Home Page Figure" />
                        </Col>

                        <Col md={8}>
                            <h3>About SCATLAS-LC</h3>
                            <p>
                                SCATLAS-LC (Single-Cell ATLAS in Liver Cancer) is a publicly available data portal of single-cell transcriptomic profiles of tumor cell communities in hepatocellular carcinoma and intrahepatic cholangiocarcinoma
                            </p>

                            <p>
                                SCATLAS-LC can be used to evaluate gene expression in malignant cells and various non-malignant cells in liver cancer. It can be further used to determine gene expression in different subtypes of stromal cells and immune cells.
                            </p>
                        </Col>

                    </Row>
                </Card.Body>
            </Card>
        </Container>

    );
}