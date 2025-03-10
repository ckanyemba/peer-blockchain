import React, { Component } from "react";
import { Button } from "react-bootstrap";
import Transaction from "./Transaction";
import { Link } from "react-router-dom";
import history from "../../history";

const POLL_INTERVAL_MS = 10000;

class TransactionPool extends Component {
  state = { transactionPoolMap: {} };

  fetchTransactionPoolMap = () => {
    fetch(`/api/transaction-pool-map`)
      .then(response => response.json())
      .then(json => this.setState({ transactionPoolMap: json }));
  };

  fetchMineTransactions = () => {
    fetch(`/api/mine-transactions`).then(
      response => {
        if (response.status === 200) {
          alert("success");
          history.push("/blocks");
        } else {
          alert("The mine-transactions block request did not complete.");
        }
      }
    );
  };

  componentDidMount() {
    this.fetchTransactionPoolMap();

    // refetch transaction pool data every 10s
    this.fetchPoolMapInterval = setInterval(
      () => this.fetchTransactionPoolMap(),
      POLL_INTERVAL_MS
    );
  }

  componentWillUnmount() {
    clearInterval(this.fetchPoolMapInterval);
  }

  render() {
    return (
      <div className="TransactionPool">
        <div>
          <h3 className="pageTitle">Transaction Pool</h3>
          {Object.values(this.state.transactionPoolMap).map(transaction => {
            return (
              <div key={transaction.id}>
                <hr style={{ borderColor: "orange" }} />
                <Transaction transaction={transaction} />
              </div>
            );
          })}
          <hr style={{ borderColor: "orange" }} />
          <Button variant="danger" onClick={this.fetchMineTransactions}>
            Mine the Transactions
          </Button>
        </div>
      </div>
    );
  }
}

export default TransactionPool;