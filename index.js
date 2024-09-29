const express = require("express");
const request = require("request");
const path = require("path");
const redis = require("redis");
const cors = require("cors");

const bodyParser = require("body-parser");
const Blockchain = require("./models/blockchain");
const PubSub = require("./app/pubsub");
const TransactionPool = require("./models/wallet/transaction-pool");
const Wallet = require("./models/wallet");
const TransactionMiner = require("./app/transaction-miner");
require("dotenv").config(); // Load environment variables from .env file

const isDevelopment = process.env.ENV === "development";

// Environment variables for Redis
const REDIS_URL = isDevelopment
  ? "redis://127.0.0.1:6379" // Local Redis URL for development
  : process.env.KV_URL; // Use Upstash Redis URL for production

// Create Redis client
const redisClient = redis.createClient({
  url: REDIS_URL
});

// Handle Redis connection errors
redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

// Connect to Redis
redisClient
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((err) => {
    console.error("Redis connection failed:", err);
  });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = isDevelopment
  ? `http://localhost:${DEFAULT_PORT}`
  : "https://blockchain-bureau.vercel.app";

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, redisClient });
const transactionMiner = new TransactionMiner({
  blockchain,
  transactionPool,
  wallet,
  pubsub
});

setTimeout(() => pubsub.broadcastChain(), 1500);
// Set up periodic checking for updates
setInterval(async () => {
  await pubsub.checkForUpdates();
}, 5000); // Check every 5 seconds
app.use(
  cors({
    origin: ["https://peer-cryptochain.vercel.app", "http://localhost:3000"]
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client/dist")));

require("./routes/blockchain")(
  app,
  blockchain,
  transactionPool,
  wallet,
  transactionMiner,
  pubsub
);
require("./routes/wallet")(
  app,
  blockchain,
  transactionPool,
  wallet,
  transactionMiner,
  pubsub
);

// Serve the frontend after API routes are defined
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// Request the transaction pool map data
const syncWithRootState = () => {
  // Request the blockchain data
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/blocks` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        try {
          const rootChain = JSON.parse(body);
          blockchain.replaceChain(rootChain);
        } catch (err) {
          console.error(
            "Error parsing blocks JSON response:",
            err,
            "Response body:",
            body
          );
        }
      } else {
        console.error(
          "Failed to fetch blocks. Status Code:",
          response?.statusCode,
          error
        );
      }
    }
  );

  // Request the transaction pool map data
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        if (body) {
          try {
            console.log("Response from /api/transaction-pool-map:", body); // Add this line to see the response
            const rootTransactionPoolMap = JSON.parse(body);
            console.log(
              "replace transaction pool map on a sync with",
              rootTransactionPoolMap
            );
            transactionPool.setMap(rootTransactionPoolMap);
          } catch (err) {
            console.error(
              "Error parsing transaction pool map JSON response:",
              err
            );
          }
        } else {
          console.error(
            "Received an empty response for /api/transaction-pool-map."
          );
        }
      } else {
        console.error(
          "Failed to fetch transaction pool map. Status Code:",
          response?.statusCode,
          error
        );
      }
    }
  );
};

if (isDevelopment) {
  const walletFoo = new Wallet();
  const walletBar = new Wallet();

  const generateWalletTransaction = ({ wallet, recipient, amount }) => {
    const transaction = wallet.createTransaction({
      recipient,
      amount,
      chain: blockchain.chain
    });

    transactionPool.setTransaction(transaction);
  };

  const walletAction = () => {
    generateWalletTransaction({
      wallet,
      recipient: walletFoo.publicKey,
      amount: 5
    });
  };

  const walletFooAction = () => {
    generateWalletTransaction({
      wallet: walletFoo,
      recipient: walletBar.publicKey,
      amount: 10
    });
  };

  const walletBarAction = () => {
    generateWalletTransaction({
      wallet: walletBar,
      recipient: wallet.publicKey,
      amount: 15
    });
  };

  for (let i = 0; i < 10; i++) {
    if (i % 3 === 0) {
      walletAction();
      walletFooAction();
    } else if (i % 3 === 1) {
      walletAction();
      walletBarAction();
    } else {
      walletFooAction();
      walletBarAction();
    }

    transactionMiner.mineTransactions();
  }
}

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === "true") {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`listening at ${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState();
  }
});
