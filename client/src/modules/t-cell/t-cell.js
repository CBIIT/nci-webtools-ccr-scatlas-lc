import { Suspense } from 'react'
import { useRecoilState } from 'recoil';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import TCellsPlots from './t-cell-plots';
import TCellPlotOptions from './t-cell-plot-options';
import { tCellState } from './t-cell.state';

export default function TCell() {
    const [tCell, settCell] = useRecoilState(tCellState);

    return (
        <Container className="py-4">

            <Card className="shadow mb-4">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <Card.Title className="my-1">
                        T Cells
                    </Card.Title>
                    {tCell && <Button variant="light" size="sm" onClick={_ => settCell('')}>
                        Clear T-Cell ({tCell})
                    </Button>}
                </Card.Header>
                <Card.Body>
                    <TCellPlotOptions />
                    <hr />
                    <Suspense fallback={<div>Loading...</div>}>
                        <TCellsPlots />
                    </Suspense>
                </Card.Body>
            </Card>
        </Container>
    );
}