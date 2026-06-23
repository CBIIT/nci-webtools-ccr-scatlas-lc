import { useState, useRef, forwardRef } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { Container, Navbar, Nav, Dropdown } from "react-bootstrap";

// 3-level main menu. A `route` of null marks a placeholder leaf not yet wired to a
// page (the top-level Atlas entries point at summary pages that don't exist yet).
export const navMenu = [
  { title: "Home", route: "/" },
  {
    title: "Single-Cell Atlas",
    route: "/single-cell", // Single-Cell Atlas Summary (full page: NCIATWP-10324)
    children: [
      { title: "NCI-CLARITY", route: "/nci-clarity" },
      { title: "Multi-Regional", route: "/multi-regional" },
      { title: "Sequential NCI-CLARITY", route: "/sequential" },
    ],
  },
  {
    title: "Spatial Atlas",
    route: "/spatial", // Spatial Atlas Summary (full page: NCIATWP-10325)
    children: [
      {
        title: "Transcriptomics",
        children: [
          {
            title: "Multi-Regional",
            route: "/spatial/transcriptomics/multi-regional",
          },
          { title: "European", route: "/spatial/transcriptomics/european" },
          { title: "TIGER-LC", route: "/spatial/transcriptomics/tiger-lc" },
        ],
      },
      {
        title: "Proteomics",
        children: [
          {
            title: "TIGER-LC ICCA",
            route: "/spatial/proteomics/tiger-lc-icca",
          },
          { title: "TIGER-LC HCC", route: "/spatial/proteomics/tiger-lc-hcc" },
          { title: "LCI HCC", route: "/spatial/proteomics/lci-hcc" },
        ],
      },
    ],
  },
  { title: "About", route: "/about" },
];

// A leaf menu entry: navigates when it has a route, otherwise renders as a muted
// placeholder so unwired items read as "scaffold, not yet hooked up".
function Leaf({ item, asDropdownItem }) {
  if (asDropdownItem) {
    if (!item.route)
      return (
        <Dropdown.Item as="span" disabled className="text-muted">
          {item.title}
        </Dropdown.Item>
      );
    return (
      <Dropdown.Item as={NavLink} to={item.route}>
        {item.title}
      </Dropdown.Item>
    );
  }

  // top-level leaf (Home / About) rendered as a NavLink in the navbar
  return (
    <NavLink
      exact
      activeClassName="active"
      className="nav-link px-3 text-uppercase font-weight-bold"
      to={item.route}>
      {item.title}
    </NavLink>
  );
}

// Toggle styled as a dropdown row (used for nested submenus), with a chevron
// hinting that it opens a further menu to the side.
const SubmenuToggle = forwardRef(function SubmenuToggle(
  { children, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className="dropdown-item d-flex justify-content-between align-items-center"
      onClick={onClick}>
      {children}
      <i className="bi bi-chevron-right ms-2 small" />
    </button>
  );
});

// True when the current route is this item's route or any descendant's — used to
// highlight the top-level menu for the section you're in.
function isActive(item, pathname) {
  if (item.route && item.route === pathname) return true;
  return (item.children || []).some((child) => isActive(child, pathname));
}

// Top-level toggle: clicking navigates to the section's summary page, while the
// submenu opens on hover (below). Forwards the ref so the dropdown can anchor its
// menu to it. Ignores react-bootstrap's own click-to-toggle — hover handles opening.
const TopNavToggle = forwardRef(function TopNavToggle(
  { title, active, onNavigate },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onNavigate}
      className={`nav-link px-3 text-uppercase font-weight-bold ${
        active ? "active" : ""
      }`}>
      {title}
    </button>
  );
});

// A node with children. At the navbar level it is a top-level dropdown (clicking the
// label navigates to its summary page); nested it becomes a side-opening submenu.
// Open on hover.
function Branch({ item, level, pathname }) {
  const [show, setShow] = useState(false);
  const closeTimer = useRef(null);
  const history = useHistory();
  const isTop = level === 0;

  // Open immediately on hover, but close on a short delay so moving the mouse across
  // the small gap into a side-opening submenu (Transcriptomics → its cohorts) doesn't
  // collapse it before you arrive.
  const open = () => {
    clearTimeout(closeTimer.current);
    setShow(true);
  };
  const close = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setShow(false), 20);
  };

  const toggle = isTop ? (
    <Dropdown.Toggle
      as={TopNavToggle}
      title={item.title}
      active={isActive(item, pathname)}
      onNavigate={() => item.route && history.push(item.route)}
    />
  ) : (
    <Dropdown.Toggle as={SubmenuToggle}>{item.title}</Dropdown.Toggle>
  );

  return (
    <Dropdown
      as={isTop ? undefined : "div"}
      drop={isTop ? "down" : "end"}
      show={show}
      onMouseEnter={open}
      onMouseLeave={close}
      onToggle={(next) => {
        clearTimeout(closeTimer.current);
        setShow(next);
      }}>
      {toggle}
      <Dropdown.Menu>
        {item.children.map((child, i) =>
          child.children ? (
            <Branch key={i} item={child} level={level + 1} pathname={pathname} />
          ) : (
            <Leaf key={i} item={child} asDropdownItem />
          )
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}

// The main site navigation. Renders the recursive 3-level menu from `navMenu`.
export default function MainNav({ pathname }) {
  return (
    <Navbar bg="dark" expand="sm" className="navbar-dark py-0 flex-none-auto">
      <Container>
        <Navbar.Toggle aria-controls="app-navbar" />
        <Navbar.Collapse id="app-navbar">
          <Nav className="mr-auto main-nav">
            {navMenu.map((item, i) =>
              item.children ? (
                <Branch key={i} item={item} level={0} pathname={pathname} />
              ) : (
                <Leaf key={i} item={item} />
              )
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
