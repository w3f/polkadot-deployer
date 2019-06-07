const crypto = require('@w3f/libp2p-crypto');


module.exports = {
  createNodeKeys: async (nodes) => {
    const output = [];

    for (let n = 0; n < nodes; n++) {
      const nodeKey = await createNodeKey();
      output.push(nodeKey);
    }

    return output;
  }
}

function createNodeKey() {
  return new Promise((resolve, reject) => {
    crypto.keys.generateKeyPair('ed25519', 128, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const nodeKey = key.bytes.toString('hex').substr(8, 64);
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
