const crypto = require('libp2p-crypto');


module.exports = {
  createNodeKeys: async () => {
    const output = [];

    // for now we only create nodeKey for the first node
    const nodeKey = await createNodeKey();
    output.push(nodeKey);

    return output;
  }
}

function createNodeKey() {
  return new Promise((resolve, reject) => {
    crypto.keys.generateKeyPair('secp256k1', (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const nodeKey = key.bytes.toString('hex').substr(8);
      key.id((err, peerId) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ nodeKey, peerId });
      })
    })
  });
}
