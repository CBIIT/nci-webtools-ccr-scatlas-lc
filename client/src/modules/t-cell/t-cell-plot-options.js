import { useState } from 'react';
import { useRecoilState } from 'recoil';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { markerConfigState, geneState } from './t-cell.state';

export default function TCellPlotOptions() {
    const [markerConfig, setMarkerConfig] = useRecoilState(markerConfigState);
    const [config, setConfig] = useState(markerConfig);
    const [gene, setGene] = useRecoilState(geneState);

    function handleChange(event) {
        const { name, value } = event.target;
        const [min, max] = {
            size: [1, 10],
            opacity: [0.1, 1],
        }[name];
        const clampedValue = Math.min(max, Math.max(min, value));
        setConfig({ ...config, [name]: value });
        setMarkerConfig({ ...markerConfig, [name]: clampedValue });
    }

    function handleBlur() {
        setConfig(markerConfig);
    }

    return (
        <Row as={Form}>
            <Col md={3}>
                <Form.Group controlId="cell-size">
                    <Form.Label>Cell Size</Form.Label>
                    <Form.Control type="number" name="size" value={config.size} onChange={handleChange} onBlur={handleBlur} min="1" max="10" />
                </Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group controlId="cell-opacity">
                    <Form.Label>Cell Opacity</Form.Label>
                    <Form.Control type="number" name="opacity" value={config.opacity} onChange={handleChange} onBlur={handleBlur} step="0.1" max="1" min="0.1" />
                </Form.Group>
            </Col>

            <Col md={6}>
                <div className='float-right'>
                    <span>&nbsp;</span>
                    {gene && <Button variant="primary form-control mt-2" size="sm" onClick={_ => setGene('')}>
                        Clear Gene ({gene})
                </Button>}
                </div>
            </Col>
        </Row>
    );
}