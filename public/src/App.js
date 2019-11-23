import React from 'react';
import {
  BrowserRouter as Router,
  Link,
  Route
} from "react-router-dom";
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Home from './Home';
import Trending from './Trending';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
        <div className="App">
          <Navbar bg="primary" variant="dark" expand="lg">
            <Navbar.Brand href="/">Credz.io</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Nav className="mr-auto" navbar>
              <Nav.Link tag={Link} href="/trending">Trending</Nav.Link>
            </Nav>
          </Navbar>
          <div className="content">
            <Route path="/" component={Home}/>
            <Route path="/trending" component={Trending}/>
          </div>
      </div>
    </Router>
  );
}

export default App;
