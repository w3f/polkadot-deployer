const Keyring = require('@polkadot/keyring').default;
const { mnemonicGenerate, mnemonicToSeed, mnemonicValidate } = require('@polkadot/util-crypto');
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
        const { seedU8a, seed, mnemonic } = generateSeed();

        let keyring;
        if (type === 'session') {
          keyring = keyringEd;
        } else {
          keyring = keyringSr;
        }

        const pair = keyring.addFromSeed(seedU8a);
        const address = pair.address();
        output[type].push({ address, seed, mnemonic });

        files.writeKeyFile(config.name, n, type, keyring.toJson(address));
      });
    }
    return output;
  },
}

function  generateSeed() {
  const mnemonic = mnemonicGenerate();
  const isValidMnemonic = mnemonicValidate(mnemonic);

  if (!isValidMnemonic) {
    throw new Error('generated invalid mnemonic!');
  }

  const seedU8a = mnemonicToSeed(mnemonic);
  const seed = u8aToHex(seedU8a);

  return { seed, seedU8a, mnemonic};
}
