import Spinner from "react-bootstrap/Spinner";

export default function Loader({ message }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 bg-white o-75 position-absolute top-0 start-0">
      <div className="text-center">
        <Spinner variant="primary" animation="border" role="status" />
        <div>{message || "Loading"}</div>
      </div>
    </div>
  );
}
