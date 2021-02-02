import { Suspense } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import GeneExpressionPlots from './gene-expression-plots';
import GeneExpressionCounts from './gene-expression-counts';

export default function GeneExpression() {
    return (
        <Container className="py-4">

            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-0">
                        Gene Expression
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <Suspense fallback={<div>Loading...</div>}>
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
                <Card.Body>
                    <Suspense fallback={<div>Loading...</div>}>
                        <GeneExpressionCounts />
                    </Suspense>
                </Card.Body>
            </Card>

        </Container>
    );
}