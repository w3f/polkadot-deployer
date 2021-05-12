const crypto = require('libp2p-crypto');
const process = require('process');


module.exports = {
  createNodeKeys: async (nodes, environment=false) => {
    if (environment) {
      return environmentNodeKeys(nodes);
    }
    const output = [];

    for (let n = 0; n < nodes; n++) {
      const nodeKey = await createNodeKey();
      output.push(nodeKey);
    }

    return output;
  }
}

async function createNodeKey() {
  const key = await crypto.keys.generateKeyPair('ed25519', 128)
  const nodeKey = key.bytes.toString('hex').substr(8, 64);
  const peerId = await key.id()
  return {nodeKey, peerId}
}

function environmentNodeKeys(nodes){
  const output = [];

  for (let n = 0; n < nodes; n++) {
    const envVarPrefix = `POLKADOT_DEPLOYER_NODE_KEYS_${n}`;

    const nodeKey = process.env[`${envVarPrefix}_KEY`];
    const peerId = process.env[`${envVarPrefix}_PEER_ID`];

    output.push({ nodeKey, peerId });
  }
  return output;
}
