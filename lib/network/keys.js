const Keyring = require('@polkadot/keyring').default;
const stringToU8a = require('@polkadot/util/string/toU8a').default;
const u8aToHex = require('@polkadot/util/u8a/toHex').default;
const { waitReady } = require('@polkadot/wasm-crypto');

const files = require('../core/files');


module.exports = {
  createAndSave: async (config) => {
    const output = {stash: [], controller: [], session: []};
    const keyringEd = new Keyring({ type: 'ed25519' });
    const keyringSr = new Keyring({ type: 'sr25519' });

    await waitReady();

    for (const n of Array(config.nodes).keys()) {
      ['stash', 'controller', 'session'].forEach((type) => {
        const seed = module.exports._sessionSeed(config, n, type);

        let keyring;
        if (type === 'session') {
          keyring = keyringEd;
        } else {
          keyring = keyringSr;
        }

        const pair = keyring.addFromSeed(seed);
        const address = pair.address();

        output[type].push(address);

        files.writeKeyFile(config.name, n, type, keyring.toJson(address));
      });
    }
    return output;
  },

  _sessionSeed: (config, index, type) => {
    let keyId = `//${config.name}-${index}`;

    if (type === 'stash') {
      keyId = `${output}//stash`
    }

    return stringToU8a(keyId.padEnd(32, ' '));
  },

  sessionKey: (config, index) => {
    const seed = module.exports._sessionSeed(config, index, 'session');

    return u8aToHex(seed);
  }
}
