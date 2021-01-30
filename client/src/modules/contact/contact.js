import { useRecoilState } from 'recoil';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import contactState from './contact.state';

export default function Contact() {
    const [state, setState] = useRecoilState(contactState);

    function handleChange(ev) {
        const { name, value } = ev.target;
        setState({
            ...state,
            [name]: value
        });
    }

    async function handleSubmit() {

    }

    function handleReset() {

    }

    return (
        <Container className="py-4">
            <Form
                onSubmit={handleSubmit}
                onReset={handleReset}
                noValidate>
                <Card className="shadow">
                    <Card.Header className="bg-primary text-white">
                        <Card.Title className="my-0">
                            Contact Us
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>

                        <Row>
                            <Col md={6}>
                                <Form.Group controlId="name">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control name="name" value={state.name} onChange={handleChange} placeholder="Enter name" />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group controlId="email">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control type="email" name="email" value={state.email} onChange={handleChange} placeholder="Enter email" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group controlId="subject">
                            <Form.Label>Subject</Form.Label>
                            <Form.Control name="subject" value={state.setState} onChange={handleChange} placeholder="Enter subject" />
                        </Form.Group>

                        <Form.Group controlId="body">
                            <Form.Label>Message Body</Form.Label>
                            <Form.Control name="body" value={state.body} onChange={handleChange} placeholder="Enter subject" as="textarea" />
                        </Form.Group>

                    </Card.Body>

                    <Card.Footer className="text-right">
                        <Button type="reset" variant="outline-danger" className="mr-1" outline>Cancel</Button>
                        <Button type="submit" variant="primary">Submit</Button>
                    </Card.Footer>
                </Card>
            </Form>
        </Container>


    );
}
