import { useState } from "react";
import { Card } from "react-bootstrap";
import { useHistory } from "react-router-dom";

// Shared cohort widget for the atlas summary pages. The image region flips on
// hover or keyboard focus (CSS 3D) to reveal the description, which may contain
// real external links. The bottom gray segment (title + count) never flips and
// is the only click-to-navigate target — clicks on the image/description side
// do nothing, so text can be selected and links clicked without surprise
// navigation. Reused by both the Single-Cell and Spatial summary pages.
export default function CohortWidget({ image, title, count, description, to }) {
  const history = useHistory();
  // flip is state-driven (not pure CSS :hover) so the flip zone can release
  // pointer events once flipped, letting description links receive clicks
  const [flipped, setFlipped] = useState(false);

  function navigate() {
    // a drag-select ends in a click too — if the user just selected the footer
    // text, don't treat the mouseup as navigation
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    history.push(to);
  }

  return (
    <div
      className={`cohort-widget shadow${flipped ? " cohort-widget-flipped" : ""}`}
      onMouseLeave={() => setFlipped(false)}>
      {/* transparent hover target over the flip (image) region — entering it
          flips the card; it sits outside the rotating inner so the flip stays
          stable. Once flipped it goes pointer-transparent (CSS) so back-face
          links are clickable; the card unflips when the mouse leaves the
          whole widget. */}
      <span
        className="cohort-widget-flip-zone"
        onMouseEnter={() => setFlipped(true)}
        aria-hidden="true"
      />
      <div className="cohort-widget-inner">
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

      {/* non-flipping bottom gray segment — the navigation target */}
      <div
        role="link"
        tabIndex={0}
        aria-label={`${title} cohort`}
        className="cohort-widget-footer text-center p-3"
        onClick={navigate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate();
          }
        }}>
        <h3 className="h5 text-dark mb-1">{title}</h3>
        {count && <div className="text-muted mb-0">{count}</div>}
      </div>
    </div>
  );
}
