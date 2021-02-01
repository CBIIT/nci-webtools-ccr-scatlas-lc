import  { Suspense } from 'react'
import TCells from './t-cells';

export default function TCellsIndex() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TCells />
        </Suspense>
    );
}