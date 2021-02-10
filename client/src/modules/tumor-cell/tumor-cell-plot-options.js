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
    const [formValues, setFormValues] = useState(plotOptions);
    const lookup = useRecoilValue(lookupQuery);
    const mergePlotOptions = obj => setPlotOptions({...plotOptions, ...obj});
    const mergeFormValues = obj => setFormValues({...formValues, ...obj});

    function handleChange(event) {
        const { name, value, min, max } = event.target;
        const clampedValue = Math.min(+max, Math.max(+min, value));
        mergePlotOptions({[name]: clampedValue});
        mergeFormValues({[name]: value});
    }

    function handleBlur() {
        mergeFormValues(plotOptions);
    }

    return (
        <Row as={Form}>
            <Col md={3}>
                <Form.Group controlId="cell-size">
                    <Form.Label>Cell Size</Form.Label>
                    <Form.Control 
                        type="number" 
                        name="size" 
                        value={formValues.size} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        min="1" 
                        max="10" />
                </Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group controlId="cell-opacity">
                    <Form.Label>Cell Opacity</Form.Label>
                    <Form.Control 
                        type="number" 
                        name="opacity" 
                        value={formValues.opacity} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        step="0.1" 
                        min="0.1" 
                        max="1" />
                </Form.Group>
            </Col>
            <Col md={3}>
                <Form.Group controlId="plot-gene">
                    <Form.Label>Gene</Form.Label>
                    <InputGroup className="flex-nowrap">
                        <Typeahead
                            id="plot-gene"
                            className="w-100"
                            onChange={([gene]) => mergePlotOptions({gene})}
                            options={lookup.gene}
                            placeholder="All genes"
                            selected={[plotOptions.gene].filter(Boolean)}
                        />
                        <InputGroup.Append>
                            <Button 
                                variant="primary" 
                                disabled={!plotOptions.gene} 
                                onClick={_ => mergePlotOptions({gene: null})}>
                                Clear
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </Col>
        </Row>
    );
}