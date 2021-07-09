import { useRecoilState } from "recoil";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Loader from "../components/loader";
import { query } from "../../services/query";
import {
  formState,
  messagesState,
  loadingState,
  defaultFormState,
  defaultMessagesState,
  defaultLoadingState,
} from "./contact.state";

export default function Contact() {
  const [form, setForm] = useRecoilState(formState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const [loading, setLoading] = useRecoilState(loadingState);

  function removeMessage(index) {
    setMessages(messages.filter((_, i) => i !== index));
  }

  function handleChange(ev) {
    const { name, value } = ev.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      await query("/api/sendMail", form, { method: "POST" });
      setMessages([
        {
          type: "success",
          content: "We have received your email and will get back to you.",
        },
      ]);
    } catch (e) {
      setMessages([
        {
          type: "danger",
          content:
            "There was an error sending your email. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset(event) {
    event.preventDefault();
    setForm(defaultFormState);
    setMessages(defaultMessagesState);
    setLoading(defaultLoadingState);
    return false;
  }

  return (
    <Container className="py-4">
      <Form onSubmit={handleSubmit} onReset={handleReset}>
        <Card className="shadow">
          <Card.Header className="bg-primary text-white">
            <Card.Title className="my-1">Contact Us</Card.Title>
          </Card.Header>
          <Card.Body className="position-relative">
            {loading && <Loader message="Sending email" />}
            {messages.map(({ type, content }, i) => (
              <Alert
                key={`message-${i}`}
                variant={type}
                dismissible
                onClose={(_) => removeMessage(i)}>
                {content}
              </Alert>
            ))}

            <Row>
              <Col md={6}>
                <Form.Group controlId="name" className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="subject" className="mb-3">
              <Form.Label>Affiliation</Form.Label>
              <Form.Control
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter affiliation"
                required
              />
            </Form.Group>

            <Form.Group controlId="body" className="mb-3">
              <Form.Label>Message Body</Form.Label>
              <Form.Control
                name="body"
                value={form.body}
                onChange={handleChange}
                placeholder="Enter your message"
                as="textarea"
                required
              />
            </Form.Group>

            <div className="text-end bg-light">
              <Button type="reset" variant="outline-dark" className="me-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Submit
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Form>
    </Container>
  );
}
