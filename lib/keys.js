const Keyring = require('@polkadot/keyring').default;
const stringToU8a = require('@polkadot/util/string/toU8a').default;
const { waitReady } = require('@polkadot/wasm-crypto');

const files = require('./files');


module.exports = {
  createAndSave: async (config) => {
    const output = {stash: [], controller: [], session: []};
    const keyringEd = new Keyring({ type: 'ed25519' });
    const keyringSr = new Keyring({ type: 'sr25519' });

    await waitReady();

    for (const n of Array(config.nodes).keys()) {
      ['stash', 'controller', 'session'].forEach((type) => {
        const keyID = module.exports.id(config, n, type);

        let keyring, seed, pair;

        if (type === 'session') {
          seed = keyID.padEnd(32, ' ');
          keyring = keyringEd;
          pair = keyring.addFromSeed(stringToU8a(seed));
        } else {
          seed = keyID;
          keyring = keyringSr;
          pair = keyring.addFromUri(seed);
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
  }
}
