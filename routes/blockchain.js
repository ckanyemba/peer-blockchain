const Wallet = require("../models/wallet");
const Blockchain = require("../models/blockchain");

module.exports = (
  app,
  blockchain,
  transactionPool,
  wallet,
  transactionMiner,
  pubsub
) => {
  app.post("/api/transact", (req, res) => {
    const { amount, recipient } = req.body;
    // check if transaction inside transactionPool
    let transaction = transactionPool.existingTransaction({
      inputAddress: wallet.publicKey
    });

    try {
      if (transaction) {
        transaction.update({ senderWallet: wallet, recipient, amount });
      } else {
        transaction = wallet.createTransaction({
          recipient,
          amount,
          chain: blockchain.chain
        });
      }
    } catch (error) {
      return res.status(400).json({ type: "error", message: error.message });
    }

    transactionPool.setTransaction(transaction);

    pubsub.broadcastTransaction(transaction);

    res.json({ type: "success", transaction });
  });

  app.get("/api/transaction-pool-map", (req, res) => {
    res.json(transactionPool.transactionMap);
  });

  app.get("/api/mine-transactions", (req, res) => {
    try {
      console.log("Mining transactions...");
      transactionMiner.mineTransactions();
      console.log("Transactions mined successfully.");
      res.redirect("/api/blocks");
    } catch (error) {
      console.error("Error mining transactions:", error);
      res.status(500).json({ type: "error", message: "Mining failed" });
    }
  });
  
  app.get("/api/blocks", (req, res) => {
    res.json(blockchain.chain); // Ensure blockchain.chain is returning valid JSON
  });
  
  app.get("/api/blocks/length", (req, res) => {
    res.json(blockchain.chain.length); // Ensure blockchain.chain is returning valid JSON
  });

  app.get("/api/blocks/:id", (req, res) => {
    const { id } = req.params;
    const { length } = blockchain.chain;

    const blocksReversed = blockchain.chain.slice().reverse();

    let startIndex = (id-1) * 5;
    let endIndex = id * 5;

    startIndex = startIndex < length ? startIndex : length;
    endIndex = endIndex < length ? endIndex : length;

    res.json(blocksReversed.slice(startIndex, endIndex));
  });
  
  

  app.get("/api/wallet-info", (req, res) => {
    try {
      const address = wallet.publicKey;
      const balance = Wallet.calculateBalance({
        chain: blockchain.chain,
        address
      });
      
      console.log('Wallet info retrieved successfully:', { address, balance });
      
      res.json({
        address,
        balance
      });
    } catch (error) {
      console.error('Error in /api/wallet-info route:', error);
      res.status(500).json({ 
        error: 'An error occurred while fetching wallet info',
        details: error.message
      });
    }
  });

  app.get("/api/known-addresses", (req, res) => {
    const addressMap = {};

    for (let block of blockchain.chain) {
      for (let transaction of block.data) {
        const recipients = Object.keys(transaction.outputMap);

        recipients.forEach(recipient => (addressMap[recipient] = recipient));
      }
    }

    res.json(Object.keys(addressMap));
  });
};