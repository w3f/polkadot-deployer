const Keyring = require('@polkadot/keyring').default;
const { mnemonicGenerate, mnemonicToSeed, mnemonicValidate } = require('@polkadot/util-crypto');
const u8aToHex = require('@polkadot/util/u8a/toHex').default;
const { waitReady } = require('@polkadot/wasm-crypto');


module.exports = {
  create: async (nodes) => {
    const output = {stash: [], controller: [], session: []};
    const keyringEd = new Keyring({ type: 'ed25519' });
    const keyringSr = new Keyring({ type: 'sr25519' });

    await waitReady();

    for (let counter = 0; counter < Array(nodes).length; counter++) {
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
      });
    }
    return output;
  },
}

function  generateSeed() {
  const mnemonic = generateValidMnemonic();

  const seedU8a = mnemonicToSeed(mnemonic);
  const seed = u8aToHex(seedU8a);

  return { seed, seedU8a, mnemonic};
}

function generateValidMnemonic() {
  const maxCount = 3;
  let count = 0;
  let isValidMnemonic = false;
  let mnemonic;

  while (!isValidMnemonic) {
    if (count > maxCount) {
      throw new Error('could not generate valid mnemonic!');
    }
    mnemonic = mnemonicGenerate();
    isValidMnemonic = mnemonicValidate(mnemonic);
    count++;
  }
  return mnemonic;
}
