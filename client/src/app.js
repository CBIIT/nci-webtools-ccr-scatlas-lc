import { useEffect } from 'react';
import { Route, useLocation, NavLink } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import Home from './modules/home/home';
import GeneExpression from './modules/gene-expression/gene-expression';
import TCell from './modules/t-cell/t-cell';
import Contact from './modules/contact/contact';
import './styles/main.scss';

export default function App() {
  const { pathname } = useLocation();
  useEffect(_ => window.scrollTo(0, 0), [pathname]);

  const links = [
    {
      route: '/',
      title: 'Home',
    },
    {
      route: '/gene-expression',
      title: 'Gene Expression',
    },
    {
      route: '/t-cells',
      title: 'T Cells',
    },
    {
      route: '/contact-us',
      title: 'Contact Us',
    },
  ];

  return (
    <>
      <Navbar bg="dark" expand="sm" className="navbar-dark py-0">
        <Container>
          <Navbar.Toggle aria-controls="app-navbar" />
          <Navbar.Collapse id="app-navbar">
            <Nav className="mr-auto">
              {links.map((link, index) =>
                <NavLink
                  key={`navlink-${index}`}
                  exact
                  activeClassName="active"
                  className="nav-link px-3 text-uppercase font-weight-bold"
                  to={link.route}>
                  {link.title}
                </NavLink>)}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main id="main" className="bg-light">
        <Route exact path="/" component={Home} />
        <Route exact path="/gene-expression" component={GeneExpression} />
        <Route exact path="/t-cells" component={TCell} />
        <Route exact path="/contact-us" component={Contact} />
      </main>

    </>
  );
}

