// A modality section on an atlas summary page: an icon + heading followed by its
// content (cohort widgets, etc.). The section icon highlights when this section is
// the page's active one. Activation latches — hovering the section head or any
// widget inside it (anywhere in the section) makes it active, and it stays active
// until another section is hovered or the page unmounts. Only one section per page
// is active at a time; that state is owned by the parent page.
export default function SummarySection({ icon, title, active, onActivate, children }) {
  return (
    <section className="summary-section mt-4" onMouseEnter={onActivate}>
      <div
        className={`summary-section-head${active ? " active" : ""}`}
        tabIndex={0}
        onFocus={onActivate}>
        <i className={`bi ${icon} summary-icon`} aria-hidden="true" />
        <h2 className="h5 mb-0">{title}</h2>
      </div>
      {children}
    </section>
  );
}
