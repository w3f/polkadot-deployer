const Keyring = require('@polkadot/keyring').default;
const { mnemonicGenerate, mnemonicToSeed, mnemonicValidate } = require('@polkadot/util-crypto');
const process = require('process');
const u8aToHex = require('@polkadot/util/u8a/toHex').default;
const { waitReady } = require('@polkadot/wasm-crypto');


module.exports = {
  keyTypes: () => {
    return [
      'stash',
      'controller',
      'session_grandpa',
      'session_babe',
      'session_parachain_validator',
      'session_imonline'
    ];
  },
  create: async (nodes, environment=false) => {
    if (environment) {
      return environmentKeys(nodes);
    }
    const output = {};
    const keyTypes = module.exports.keyTypes();
    keyTypes.forEach((type) => {
      output[type] = [];
    });
    const keyringEd = new Keyring({ type: 'ed25519' });
    const keyringSr = new Keyring({ type: 'sr25519' });

    await waitReady();

    for (let counter = 0; counter < nodes; counter++) {
      keyTypes.forEach((type) => {
        const { seedU8a, seed, mnemonic } = generateSeed();

        let keyring;
        if (type === 'session-grandpa') {
          keyring = keyringEd;
        } else {
          keyring = keyringSr;
        }

        const pair = keyring.addFromSeed(seedU8a);
        const address = pair.address;
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

function environmentKeys(nodes) {
  const output = {};
  const keyTypes = module.exports.keyTypes();
  keyTypes.forEach((type) => {
    output[type] = [];
  });

  for (let counter = 0; counter < nodes; counter++) {

    const envVarPrefix = `POLKADOT_DEPLOYER_KEYS_${counter}`;
    keyTypes.forEach((type) => {
      const prefix = `${envVarPrefix}_${type.toUpperCase()}`;

      const address = process.env[`${prefix}_ADDRESS`];
      const seed = process.env[`${prefix}_SEED`];

      output[type].push({ address, seed });
    });
  }
  return output;
}
