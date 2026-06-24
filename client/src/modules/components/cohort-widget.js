import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";

// Shared cohort widget for the atlas summary pages. Front shows image + title +
// count; on hover or keyboard focus the card flips (CSS 3D) to reveal the
// description. The whole card is a link, so clicking navigates to the cohort page.
// Reused by both the Single-Cell and Spatial summary pages.
export default function CohortWidget({ image, title, count, description, to }) {
  return (
    <Link
      to={to}
      className="cohort-widget text-decoration-none"
      aria-label={`${title} cohort`}>
      <div className="cohort-widget-inner shadow">
        <Card className="cohort-widget-face cohort-widget-front border-0">
          <Card.Img
            variant="top"
            src={image}
            alt={`${title} cohort`}
            className="cohort-widget-img"
          />
          <Card.Body className="text-center">
            <Card.Title as="h3" className="h5 text-dark mb-1">
              {title}
            </Card.Title>
            {count && <div className="text-muted small">{count}</div>}
          </Card.Body>
        </Card>

        <Card className="cohort-widget-face cohort-widget-back border-0 bg-primary text-white">
          <Card.Body className="d-flex flex-column">
            <Card.Title as="h3" className="h5 mb-2">
              {title}
            </Card.Title>
            <div className="small overflow-auto">{description}</div>
          </Card.Body>
        </Card>
      </div>
    </Link>
  );
}
