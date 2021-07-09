import Spinner from "react-bootstrap/Spinner";

export default function Loader({ message }) {
  return (
    <div className="overlay-center">
      <Spinner variant="primary" animation="border" role="status" />
      <div>{message || "Loading"}</div>
    </div>
  );
}
