import { Suspense } from 'react';
import { useRecoilState } from 'recoil';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import GeneExpressionPlots from './gene-expression-plots';
import GeneExpressionPlotOptions from './gene-expression-plot-options';
import GeneExpressionCounts from './gene-expression-counts';
import { geneState } from './gene-expression.state';

export default function GeneExpression() {
    const [gene, setGene] = useRecoilState(geneState);

    return (
        <Container className="py-4">

            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-0">
                        Gene Expression
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <GeneExpressionPlotOptions />
                    <hr />
                    <Suspense fallback={<div>Loading...</div>}>

                        {gene && <Button variant="primary" onClick={_ => setGene('')}>Clear Gene ({gene})</Button>}
                        <GeneExpressionPlots />
                    </Suspense>
                </Card.Body>
            </Card>

            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-0">
                        Cell Counts
                    </Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                    <Suspense fallback={<div>Loading...</div>}>
                        <GeneExpressionCounts />
                    </Suspense>
                </Card.Body>
            </Card>

        </Container>
    );
}