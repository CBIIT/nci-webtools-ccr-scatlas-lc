import { Suspense } from 'react'
import { useRecoilState } from 'recoil';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Loader from '../components/loader';
import TCellsPlots from './t-cell-plots';
import TCellPlotOptions from './t-cell-plot-options';
import { geneState } from './t-cell.state';
import TCellCounts from './t-cell-counts';

export default function TCell() {

    return (
        <Container className="py-4">

            <Card className="shadow mb-4">
                <Card.Body className="position-relative">
                    <TCellPlotOptions />
                    <div style={{ minHeight: '800px' }}>
                        <Suspense fallback={<Loader message="Loading Plots" />}>
                            <TCellsPlots />
                        </Suspense>
                    </div>
                </Card.Body>
            </Card>
            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white">
                    <Card.Title className="my-1">
                        T Cell Counts
                    </Card.Title>
                </Card.Header>
                <Card.Body className="p-0 position-relative" style={{minHeight: '600px'}}>
                    <Suspense fallback={<Loader message="Loading Cell Counts" />}>
                        <TCellCounts />
                    </Suspense>
                </Card.Body>
            </Card>

        </Container>
    );
}