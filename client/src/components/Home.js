import React, { Component } from "react";
import logo from "../assets/logo.jpg";

class Home extends Component {
  state = { walletInfo: {} };

  componentDidMount() {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://peer-cryptochain.vercel.app/api/wallet-info'
      : '/api/wallet-info';
  
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(json => this.setState({ walletInfo: json }))
      .catch(err => console.error('Fetch error:', err));
  }

  render() {
    const { address, balance } = this.state.walletInfo;

    return (
      <div className="App">
        <img className="logo" src={logo} />
        <br />
        <h3>Welcome to the blockchain...</h3>
        <br />
        <div className="WalletInfo">
          <div>
            <span className="highline">Address: </span>
            {address}
          </div>
          <br />
          <div>
            <span className="highline">Balance: </span>
            {balance}
          </div>
        </div>
      </div>
    );
  }
}

export default Home;