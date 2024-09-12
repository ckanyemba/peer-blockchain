import React, { Component } from "react";

class Block extends Component {
  render() {
    const { timestamp, hash, data } = this.props.block;

    const hashDisplay = `${hash.substring(0, 15)}...`;
    const stringifiedData = JSON.stringify(data);

    const dataDisplay =
      stringifiedData.length > 15
        ? `${stringifiedData.substring(0, 15)}...`
        : stringifiedData;

    return (
      <div className="Block">
        <div>Hash: {hashDisplay} </div>
        <div>timestamp: {new Date(timestamp).toLocaleString()}</div>
        <div>Data: {dataDisplay}</div>
      </div>
    );
  }
}
