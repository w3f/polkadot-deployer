const { ApiPromise, WsProvider } = require('@polkadot/api');


class FinalityBenchmarks {
  constructor(config) {
    this.config = config;
  }

  metrics() {
    return new Promise(async (resolve) => {
      const provider = new WsProvider(this.config.wsEndpoint);
      const api = await new ApiPromise(provider).isReady;
      const result = [];

      api.rpc.chain.subscribeNewHead(async (header) => {
        console.log(`Chain is at #${header.blockNumber}`);

        const timestamp = await api.query.timestamp.now();
        console.log(`lastest block timestamp ${timestamp.toNumber()}`);

        result.push(timestamp);
        if (result.length === this.config.blocks) {
          api.disconnect();
          resolve(result);
        }
      });
    });
  }
}

module.exports = {
  FinalityBenchmarks
}
