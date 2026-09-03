// External reference link inside a cohort widget description (the widget back
// face is primary/white, so the link is white + underlined to read as a link).
// Opens in a new tab; text stays selectable/copyable.
export default function Ref({ href, children }) {
  return (
    <a
      className="text-white text-decoration-underline"
      href={href}
      target="_blank"
      rel="noopener noreferrer">
      {children}
    </a>
  );
}
