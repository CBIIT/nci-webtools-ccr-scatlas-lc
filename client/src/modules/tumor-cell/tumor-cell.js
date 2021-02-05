import { Suspense } from 'react';
import { useRecoilState } from 'recoil';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Loader from '../components/loader';
import TumorCellPlots from './tumor-cell-plots';
import TumorCellPlotOptions from './tumor-cell-plot-options';
import TumorCellCounts from './tumor-cell-counts';
import { geneState } from './tumor-cell.state';

export default function TumorCell() {
    const [gene, setGene] = useRecoilState(geneState);

    return (
        <Container className="py-4">
            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <Card.Title className="my-1">
                        Tumor Cell Communities
                    </Card.Title>
                    {gene && <Button variant="light" size="sm" onClick={_ => setGene('')}>
                        Clear Gene ({gene})
                    </Button>}
                </Card.Header>
                <Card.Body className="position-relative">
                    <TumorCellPlotOptions />
                    <hr />
                    
                    <div style={{minHeight: '800px'}}>
                        <Suspense fallback={<Loader message="Loading Plots" />}>
                            <TumorCellPlots />
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
                <Card.Body className="p-0 position-relative" style={{minHeight: '600px'}}>
                    <Suspense fallback={<Loader message="Loading Cell Counts" />}>
                        <TumorCellCounts />
                    </Suspense>
                </Card.Body>
            </Card>

        </Container>
    );
}