const { kv } = require('@vercel/kv');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.lastProcessedTimestamp = Date.now();
  }

  async publish({ channel, message }) {
    const timestamp = Date.now();
    await kv.set(`${channel}:${timestamp}`, JSON.stringify(message));
    await kv.expire(`${channel}:${timestamp}`, 3600); // Expire after 1 hour
  }

  async broadcastChain() {
    await this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: this.blockchain.chain
    });
  }

  async broadcastTransaction(transaction) {
    await this.publish({
      channel: CHANNELS.TRANSACTION,
      message: transaction
    });
  }

  async handleMessage(channel, message) {
    console.log(`Message received. Channel: ${channel}, Message:`, message);

    if (channel === CHANNELS.BLOCKCHAIN) {
      this.blockchain.replaceChain(message);
    } else if (channel === CHANNELS.TRANSACTION) {
      this.transactionPool.setTransaction(message);
    }
  }

  async subscribeToChannels() {
    for (const channel of Object.values(CHANNELS)) {
      const messages = await kv.keys(`${channel}:*`);
      for (const key of messages) {
        const [, timestamp] = key.split(':');
        if (parseInt(timestamp) > this.lastProcessedTimestamp) {
          const message = await kv.get(key);
          try {
            const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
            await this.handleMessage(channel, parsedMessage);
          } catch (error) {
            console.error(`Error parsing message for key ${key}:`, error);
            console.log('Problematic message:', message);
          }
        }
      }
    }
    this.lastProcessedTimestamp = Date.now();
  }

  // This method should be called periodically to check for new messages
  async checkForUpdates() {
    await this.subscribeToChannels();
  }
}

module.exports = PubSub;