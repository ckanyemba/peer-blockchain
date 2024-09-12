const Transaction = require('./transaction');  // Assuming you have a transaction module

class TransactionPool {
  constructor() {
    this.transactions = [];
  }

  updateOrAddTransaction(transaction) {
    let transactionWithId = this.transactions.find(
      t => t.id === transaction.id
    );
    if (transactionWithId) {
      this.transactions[this.transactions.indexOf(transactionWithId)] =
        transaction;
    } else {
      this.transactions.push(transaction);
    }
  }

  existingTransaction(address) {
    return this.transactions.find(t => t.input.address == address);
  }

  validTransactions() {
    return this.transactions.filter(transaction => {
      const outputTotal = transaction.outputs.reduce((total, output) => {
        return total + output.amount;
      }, 0);

      // Validate that the total output matches the input amount
      if (transaction.input.amount !== outputTotal) {
        console.log(`Invalid transaction from ${transaction.input.address}.`);
        return;
      }

      // Verify the transaction's signature
      if (!Transaction.verifyTransaction(transaction)) {
        console.log(`Invalid signature from ${transaction.input.address}.`);
        return;
      }

      return true;  // Valid transaction
    });
  }

  clear() {
    this.transactions = [];
  }
}

module.exports = TransactionPool;
