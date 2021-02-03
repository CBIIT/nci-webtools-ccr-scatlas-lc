import { Suspense } from 'react';
import { useRecoilState } from 'recoil';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import GeneExpressionPlots from './gene-expression-plots';
import GeneExpressionPlotOptions from './gene-expression-plot-options';
import GeneExpressionCounts from './gene-expression-counts';
import { geneState } from './gene-expression.state';

export default function GeneExpression() {
    const [gene, setGene] = useRecoilState(geneState);

    const Loader = ({message}) => (
        <div className="loader">
            <Spinner variant="primary" animation="border" role="status" />
            <div>{message || 'Loading'}</div>
        </div>
    );

    return (
        <Container className="py-4">
            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <Card.Title className="my-1">
                        Gene Expression
                    </Card.Title>
                    {gene && <Button variant="light" size="sm" onClick={_ => setGene('')}>
                        Clear Gene ({gene})
                    </Button>}
                </Card.Header>
                <Card.Body className="position-relative">
                    <GeneExpressionPlotOptions />
                    <hr />
                    
                    <div style={{minHeight: '800px'}}>
                        <Suspense fallback={<Loader message="Loading Plots" />}>
                            <GeneExpressionPlots />
                        </Suspense>
                    </div>
                </Card.Body>
            </Card>

            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-1">
                        Cell Counts
                    </Card.Title>
                </Card.Header>
                <Card.Body className="p-0" style={{minHeight: '600px'}}>
                    <Suspense fallback={<Loader message="Loading Cell Counts" />}>
                        <GeneExpressionCounts />
                    </Suspense>
                </Card.Body>
            </Card>

        </Container>
    );
}