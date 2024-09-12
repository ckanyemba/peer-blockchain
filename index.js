const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const P2pServer = require('./app/p2p-server');
const Wallet = require('./wallet');
const TransactionPool = require('./wallet/transaction-pool');
const Miner = require('./app/miner');
const path = require('path');
const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();
const bc = new Blockchain();
const wallet = new Wallet();
const tp = new TransactionPool();
const p2pServer = new P2pServer(bc, tp);
const miner = new Miner(bc, tp, wallet, p2pServer);


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));

app.get('/api/blocks/length', (req, res) => {
    res.json(bc.chain.length);
});

app.get('/api/blocks/:id', (req, res) => {
    const { id } = req.params;
    const { length } = bc.chain;

    const blocksReversed = bc.chain.slice().reserve();

    let startIndex = (id-1) * 5;
    let endIndex = id * 5;

    startIndex = startIndex < length ? startIndex : length;
    endIndex = endIndex < length ? endIndex : length;


    res.json(blocksReversed.slice(startIndex, endIndex));
    
});


app.post('/api/mine', (req, res) => {
   const block = bc.addBlock(req.body.data);
   console.log(`New block added: ${block.toString()}`); 

   p2pServer.syncChains();

   res.redirect('/blocks');
});

app.get('/api/transactions', (req, res) =>{
    res.json(tp.transactions);
});

app.post('/api/transact', (req, res) => {
    const { recipient, amount } = req.body;
    const transaction = wallet.createTransaction(recipient, amount, bc, tp);
    p2pServer.broadcastTransaction(transaction)
    res.redirect('/transactions');
});

app.get('/api/mine-transactions', (req, res) => {
    const block = miner.mine();
    console.log(`New block added: ${block.toString()}`);
    res.redirect('/blocks');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.get('/public-key', (req, res) => {
    res.json({ publicKey: wallet.publicKey });
});

app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
p2pServer.listen()