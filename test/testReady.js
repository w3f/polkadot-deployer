const { ApiPromise, WsProvider } = require('@polkadot/api');

async function waitReady() {
  const wsEndpoint = 'wss://testnet-0.kusama.network';

  const provider = new WsProvider(wsEndpoint);
  const api = await new ApiPromise(provider);

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

  api.disconnect();
}

waitReady();
