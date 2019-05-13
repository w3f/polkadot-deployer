const Keyring = require('@polkadot/keyring').default;
const stringToU8a = require('@polkadot/util/string/toU8a').default;

const files = require('./files');


module.exports = {
  createAndSave: async (config) => {
    const output = {stash: [], controller: [], session: []};
    const keyring = new Keyring();

    for (const n of Array(config.nodes).keys()) {
      ['stash', 'controller', 'session'].forEach((type) => {
        const keyID = module.exports.id(config, n, type);
        const seed = keyID.padEnd(32, ' ');

        const pair = keyring.addFromSeed(stringToU8a(seed));

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
