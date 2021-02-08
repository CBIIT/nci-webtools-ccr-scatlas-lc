import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import { Typeahead } from 'react-bootstrap-typeahead';
import { plotOptionsState, lookupQuery } from './tumor-cell.state';

export default function TumorCellPlotOptions() {
    const [plotOptions, setPlotOptions] = useRecoilState(plotOptionsState);
    const [_plotOptions, _setPlotOptions] = useState(plotOptions);
    const lookup = useRecoilValue(lookupQuery);

    function handleChange(event) {
        const { name, value } = event.target;

        console.log(event.target.min);

        const [min, max] = {
            size: [1, 10],
            opacity: [0.1, 1],
        }[name];
        const clampedValue = Math.min(max, Math.max(min, value));
        setPlotOptions({ ...plotOptions, [name]: clampedValue });
        _setPlotOptions({ ..._plotOptions, [name]: value });
    }

    function handleBlur() {
        _setPlotOptions(plotOptions);
    }

    function setGene(gene) {
        console.log(plotOptions);
        setPlotOptions({ ...plotOptions, gene })
    }

    return (
        <Row as={Form}>
            <Col md={3}>
                <Form.Group controlId="cell-size">
                    <Form.Label>Cell Size</Form.Label>
                    <Form.Control type="number" name="size" value={_plotOptions.size} onChange={handleChange} onBlur={handleBlur} min="1" max="10" />
                </Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group controlId="cell-opacity">
                    <Form.Label>Cell Opacity</Form.Label>
                    <Form.Control type="number" name="opacity" value={_plotOptions.opacity} onChange={handleChange} onBlur={handleBlur} step="0.1" max="1" min="0.1" />
                </Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group controlId="plot-gene">
                    <Form.Label>Gene</Form.Label>
                    <InputGroup className="flex-nowrap">
                        <Typeahead
                            id="plot-gene"
                            labelKey="name"
                            onChange={setGene}
                            options={lookup.gene}
                            placeholder="Select a gene"
                            selected={plotOptions.gene}
                            className="w-100"
                        />
                        <InputGroup.Append>
                            <Button variant="primary" disabled={!plotOptions.gene.length} onClick={_ => setGene([])}>
                                Clear
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </Col>
        </Row>
    );
}