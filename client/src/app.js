import { useEffect } from "react";
import { Route, useLocation, NavLink } from "react-router-dom";
import { Container, Navbar, Nav } from "react-bootstrap";
import Home from "./modules/home/home";
import TumorCell from "./modules/tumor-cell/tumor-cell";
import TCell from "./modules/t-cell/t-cell";
import Contact from "./modules/contact/contact";
import "./styles/main.scss";

export default function App() {
  const { pathname } = useLocation();
  useEffect((_) => window.scrollTo(0, 0), [pathname]);

  const links = [
    {
      route: "/",
      title: "Home",
    },
    {
      route: "/tumor-cells",
      title: "Tumor Cell Community",
    },
    {
      route: "/t-cells",
      title: "T-Cell",
    },
    {
      route: "/contact-us",
      title: "Contact Us",
    },
  ];

  return (
    <>
      <Navbar bg="dark" expand="sm" className="navbar-dark py-0 flex-none-auto">
        <Container>
          <Navbar.Toggle aria-controls="app-navbar" />
          <Navbar.Collapse id="app-navbar">
            <Nav className="mr-auto">
              {links.map((link, index) => (
                <NavLink
                  key={`navlink-${index}`}
                  exact
                  activeClassName="active"
                  className="nav-link px-3 text-uppercase font-weight-bold"
                  to={link.route}>
                  {link.title}
                </NavLink>
              ))}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div id="content" className="bg-light flex-grow-auto">
        <Route exact path="/" component={Home} />
        <Route exact path="/tumor-cells" component={TumorCell} />
        <Route exact path="/t-cells" component={TCell} />
        <Route exact path="/contact-us" component={Contact} />
      </div>
    </>
  );
}
