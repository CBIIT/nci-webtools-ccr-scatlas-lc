import { useState } from "react";
import { Card } from "react-bootstrap";
import { useHistory } from "react-router-dom";

// Shared cohort widget for the atlas summary pages. Front shows image + title +
// count; hovering the image area (or keyboard focus) flips the card (CSS 3D) to
// reveal the description, which may contain real external links. Clicking
// anywhere except a link navigates to the cohort page — the card is NOT an
// anchor itself, so description links don't nest inside another link.
// Reused by both the Single-Cell and Spatial summary pages.
export default function CohortWidget({ image, title, count, description, to }) {
  const history = useHistory();
  // flip is state-driven (not pure CSS :hover) so the flip zone can release
  // pointer events once flipped, letting description links receive clicks
  const [flipped, setFlipped] = useState(false);

  function navigate(event) {
    // real links inside the description handle themselves
    if (event.target.closest("a")) return;
    // a drag-select ends in a click too — if the user just selected text
    // (e.g. copying a description), don't treat the mouseup as navigation
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    history.push(to);
  }

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${title} cohort`}
      className={`cohort-widget${flipped ? " cohort-widget-flipped" : ""}`}
      onClick={navigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(event);
        }
      }}
      onMouseLeave={() => setFlipped(false)}>
      {/* transparent hover target over the image area only — entering it flips
          the card; it sits outside the rotating inner so the flip stays stable,
          and hovering the gray body below does not trigger a flip. Once flipped
          it goes pointer-transparent (CSS) so back-face links are clickable;
          the card unflips when the mouse leaves the whole widget. */}
      <span
        className="cohort-widget-flip-zone"
        onMouseEnter={() => setFlipped(true)}
        aria-hidden="true"
      />
      <div className="cohort-widget-inner shadow">
        <Card className="cohort-widget-face cohort-widget-front border-0">
          {image ? (
            <Card.Img
              variant="top"
              src={image}
              alt={`${title} cohort`}
              className="cohort-widget-img"
            />
          ) : (
            <div className="cohort-widget-img cohort-widget-img-placeholder d-flex flex-column align-items-center justify-content-center text-muted">
              <i className="bi bi-image fs-1" aria-hidden="true" />
              <span className="small">Image</span>
            </div>
          )}
          <Card.Body className="text-center cohort-widget-body-muted">
            <Card.Title as="h3" className="h5 text-dark mb-1">
              {title}
            </Card.Title>
            {count && <div className="text-muted">{count}</div>}
          </Card.Body>
        </Card>

        <Card className="cohort-widget-face cohort-widget-back border-0 bg-primary text-white">
          <Card.Body className="d-flex flex-column">
            <Card.Title as="h3" className="h5 mb-2">
              {title}
            </Card.Title>
            <div className="cohort-widget-desc overflow-auto">{description}</div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
