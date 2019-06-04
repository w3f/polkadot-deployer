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

      let blockCounter = 0;
      let finalizedBlockCounter = 0;

      const creationTimestamps = new Map();

      api.rpc.chain.subscribeNewHead(async (header) => {
        // for each produced block we store the timestamp
        const timestamp = Date.now();
        console.log(`New produced block: ${header.blockNumber}, timestamp: ${timestamp}`);
        blockCounter++;
        if (blockCounter - finalizedBlockCounter > 100) {
          console.log(`Too many new blocks (${blockCounter}) without finalization, exiting`);
          api.disconnect();
          resolve(([]);
        }
        creationTimestamps.set(header.blockNumber.toString(), timestamp);
      });

      api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        const finalizationTimestamp = Date.now();
        finalizedBlockCounter++;
        if (this.config.blocks.offset && finalizedBlockCounter < this.config.blocks.offset) {
          console.log(`timestamp still not recorded for this finalized block: ${header.blockNumber}, ${finalizedBlockCounter} less than offset ${this.config.blocks.offset}`)
          return;
        }

        const creationTimestamp = creationTimestamps.get(header.blockNumber.toString());
        if (!creationTimestamp) {
          console.log(`timestamp still not recorded for this finalized block: ${header.blockNumber}`)
          return;
        }

        console.log(`Last finalized block: ${header.blockNumber}, finalized at: ${finalizationTimestamp}`);

        const finalizationTime = finalizationTimestamp - creationTimestamp;
        result.push(finalizationTime);

        if (result.length === this.config.blocks.measure) {
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
