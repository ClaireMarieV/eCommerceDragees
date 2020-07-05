import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import Product from "./pages/Product";
import Products from "./pages/Products";
import Dashboard from "./pages/Dashboard";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

function App() {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:3001/admin/users")
      .then((response) => response.json())
      .then((users) => {
        setUsersLoading(false);
        setUsers(users);
      })
      .catch((error) => {
        setUsersLoading(false);
        setUsersError(JSON.stringify(error));
      });
  }, []);

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Dashboard />
        </Route>
        <Route exact path="/products">
          <Products />
        </Route>
        <Route exact path="/products/new">
          <Product />
        </Route>
        <Route exact path="/products/:productId">
          <Product />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
