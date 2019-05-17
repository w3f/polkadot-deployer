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

      let previousTimestamp = 0;
      api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        console.log(`Chain is at #${header.blockNumber}`);

        const timestamp = await api.query.timestamp.now();
        console.log(`lastest block timestamp ${timestamp.toNumber()}`);

        if (previousTimestamp !== 0) {
          const blockTime = timestamp - previousTimestamp;
          result.push(blockTime);
        }

        if (result.length === this.config.blocks) {
          api.disconnect();
          console.log(`result: ${JSON.stringify(result)}`)
          resolve(result);
        }
        previousTimestamp = timestamp;
      });
    });
  }
}

module.exports = {
  FinalityBenchmarks
}
