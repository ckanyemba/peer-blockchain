import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import history from "./history";
import Home from "./components/Home";
import Blocks from "./components/blocks/Blocks";
import ConductTransaction from "./components/transactions/ConductTransaction";
import TransactionPool from "./components/transactions/TransactionPool";
import AppNavbar from "./components/layout/Navbar";

import React, { Component } from "react";

class App extends Component {
  render() {
    return (
      <Router history={history}>
        <AppNavbar />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/blocks" element={<Blocks />} />
          <Route path="/conduct-transaction" element={<ConductTransaction />} />
          <Route path="/transaction-pool" element={<TransactionPool />} />
        </Routes>
      </Router>
    );
  }
}

export default App;