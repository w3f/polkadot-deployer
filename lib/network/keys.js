const Keyring = require('@polkadot/keyring').default;
const stringToU8a = require('@polkadot/util/string/toU8a').default;
const u8aToHex = require('@polkadot/util/u8a/toHex').default;
const { waitReady } = require('@polkadot/wasm-crypto');

const files = require('../local/files');


module.exports = {
  createAndSave: async (config) => {
    const output = {stash: [], controller: [], session: []};
    const keyringEd = new Keyring({ type: 'ed25519' });
    const keyringSr = new Keyring({ type: 'sr25519' });

    await waitReady();

    for (const n of Array(config.nodes).keys()) {
      ['stash', 'controller', 'session'].forEach((type) => {
        const keyId = module.exports.id(config, n, type);

        let keyring, pair;

        if (type === 'session') {
          keyring = keyringEd;
          const seed = module.exports.sessionSeed(keyId);
          pair = keyring.addFromSeed(seed);
        } else {
          keyring = keyringSr;
          pair = keyring.addFromUri(keyId);
        }

        const address = pair.address();

        output[type].push(address);

        const filePath = files.keyPath(config.name, n, type);
        files.writeJSON(filePath, keyring.toJson(address));
      });
    }
    return output;
  },

  id: (config, index, type) => {
    let output = `//${config.name}-${index}`;

    if (type === 'stash') {
      output = `${output}//stash`
    }

    return output;
  },

  sessionSeed: (keyId) => {
    return stringToU8a(keyId.padEnd(32, ' '));
  },

  sessionKey: (config, index) => {
    const keyId = module.exports.id(config, index, 'session');
    const seed = module.exports.sessionSeed(keyId);

    return u8aToHex(seed);
  }
}
