import { useRecoilState } from 'recoil';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { markerConfigState } from './gene-expression.state';

export default function GeneExpressionPlotOptions() {
    const [markerConfig, setMarkerConfig] = useRecoilState(markerConfigState);

    function handleChange(event) {
        const { name, value } = event.target;
        const [min, max] = {
            size: [1, 10],
            opacity: [0.1, 1],
        }[name];
        const clampedValue = Math.min(max, Math.max(min, value));
        setMarkerConfig({ ...markerConfig, [name]: clampedValue });
    }

    return (
        <Row as={Form}>
            <Col md={3}>
                <Form.Group>
                    <Form.Label>Cell Size</Form.Label>
                    <Form.Control type="number" name="size" value={markerConfig.size} onChange={handleChange} min="1" max="10" />
                </Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group>
                    <Form.Label>Cell Opacity</Form.Label>
                    <Form.Control type="number" name="opacity" value={markerConfig.opacity} onChange={handleChange} step="0.1" max="1" min="0.1" />
                </Form.Group>
            </Col>
        </Row>
    );
}