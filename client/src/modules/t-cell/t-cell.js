import  { Suspense } from 'react'
import TCellsPlots from './t-cell-plots';

export default function TCell() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TCellsPlots />
        </Suspense>
    );
}