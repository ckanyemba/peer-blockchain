// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./Token.sol";

contract DAO {
    Token public token;
    address public owner;

    struct Proposal {
        uint id;
        string description;
        uint voteCount;
        mapping(address => bool) voters;
    }

    mapping(uint => Proposal) public proposals;
    uint public proposalCount;

    constructor(Token _token) {
        token = _token;
        owner = msg.sender;
    }

    function createProposal(string memory description) public {
        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.description = description;
    }

    function vote(uint proposalId) public {
        require(token.balanceOf(msg.sender) > 0, "Must hold tokens to vote");
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.voters[msg.sender], "Already voted on this proposal");

        proposal.voteCount++;
        proposal.voters[msg.sender] = true;
    }
}