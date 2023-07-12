import { useEffect } from "react";
import { Route, useLocation, NavLink } from "react-router-dom";
import { Container, Navbar, Nav, Dropdown } from "react-bootstrap";
import Home from "./modules/home/home";
import NCIClarity from "./modules/pages/nci-clarity";
import MultiRegional from "./modules/pages/multi-regional";
import Sequential from "./modules/pages/sequential";

import "./styles/main.scss";


export default function App() {
  const { pathname } = useLocation();
  useEffect((_) => window.scrollTo(0, 0), [pathname]);

  const links = [
    {
      route: "/nci-clarity",
      title: "NCI-CLARITY",
    },
    {
      route: "/multi-regional",
      title: "Multi-Regional",
    },
    {
      route: "/sequential",
      title: "Sequential NCI-CLARITY",
    },
  ];

  return (
    <>
      <Navbar bg="dark" expand="sm" className="navbar-dark py-0 flex-none-auto">
        <Container>
          <Navbar.Toggle aria-controls="app-navbar" />
          <Navbar.Collapse id="app-navbar">
            <Nav className="mr-auto">
            <NavLink
                  key={`navlink-0`}
                  exact
                  activeClassName="active"
                  className="nav-link px-3 text-uppercase font-weight-bold"
                  to="/">
                  Home
                </NavLink>

              <Dropdown className="">
                <Dropdown.Toggle as={"button"} className={`nav-link px-3 text-uppercase font-weight-bold ${pathname !== "/" ? "active" : ""}`}>{pathname === "/" ? "Cohorts" : links.find((e) => e.route === pathname).title}</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={NavLink} to="/nci-clarity">NCI-CLARITY</Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/multi-regional">Multi-Regional</Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/sequential">Sequential NCI-CLARITY</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div id="content" className="bg-light flex-grow-auto">
        <Route exact path="/" component={Home} />
        <Route exact path="/nci-clarity" component={NCIClarity} />
        <Route exact path="/multi-regional" component={MultiRegional} />
        <Route exact path="/sequential" component={Sequential} />
      </div>
    </>
  );
}
