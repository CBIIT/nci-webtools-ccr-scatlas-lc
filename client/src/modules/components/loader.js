
export function Loader({essage}) {
    return (
        <div className="loader">
            <Spinner variant="primary" animation="border" role="status" />
            <div>{message || 'Loading'}</div>
        </div>
    );
}