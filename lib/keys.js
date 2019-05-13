const Keyring = require('@polkadot/keyring').default;
const stringToU8a = require('@polkadot/util/string/toU8a').default;
const { waitReady } = require('@polkadot/wasm-crypto');

const files = require('./files');


module.exports = {
  createAndSave: async (config) => {
    const output = {stash: [], controller: [], session: []};
    const keyring = new Keyring({ type: 'sr25519' });

    await waitReady();

    for (const n of Array(config.nodes).keys()) {
      ['stash', 'controller', 'session'].forEach((type) => {
        const seed = module.exports.id(config, n, type);

        const pair = keyring.addFromUri(seed);

        const address = pair.address();

        output[type].push(address);

        const filePath = files.keyPath(config.name, n, type);
        files.writeJSON(filePath, keyring.toJson(address));
      });
    }
    return output;
  },

  id: (config, index, type) => {
    return `//${config.name}-${index}//${type}`;
  }
}
