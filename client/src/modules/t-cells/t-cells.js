import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

export default function TCells() {
    return (
        <Container className="py-4">
            <Card className="shadow">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-0">
                        T Cells
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col xl={4}>
                            Plot 1
                        </Col>
                        <Col xl={4}>
                            Plot 2
                        </Col>
                        <Col xl={4}>
                            Plot 3
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}