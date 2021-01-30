import  { Suspense } from 'react'
import GeneExpression from './gene-expression';

export default function GeneExpressionIndex() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GeneExpression />
        </Suspense>
    );
}