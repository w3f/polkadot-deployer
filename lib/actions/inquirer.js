const inquirer = require('inquirer');

const db = require('../core/db');

module.exports = {
  defaults: {
    minValidators: 1,
    maxValidators: 200,
    minFinalityBlocks: 10,
    maxFinalityBlocks: 1000,
    allowedTypes: ['local', 'gcp']
  },
  create: async () => {
    const questions = [
      {
        name: 'name',
        type: 'input',
        message: 'Enter the new deployment name:',
        validate: async (name) => {
          const existing = await existingDeployments();

          if (existing.includes(name)) {
            console.log(`\n${name} deployment already exists, please pick another name`);
            return false;
          } else if (!name) {
            return false;
          } else {
            return true;
          }
        }
      },
      {
        name: 'type',
        type: 'list',
        message: 'Deployment type:',
        choices: ['local']
      },
      {
        name: 'nodes',
        type: 'number',
        message: `Number of Polkadot nodes (${module.exports.defaults.minValidators}-${module.exports.defaults.maxValidators}):`,
        validate: (number) => number >= module.exports.defaults.minValidators && number <= module.exports.defaults.maxValidators,
      }
    ];
    return inquirer.prompt(questions);
  },
  select: async () => {
    const existing = await existingDeployments();
    const questions = [
      {
        name: 'name',
        type: 'list',
        message: 'Select a deployment:',
        choices: existing
      }
    ];
    return inquirer.prompt(questions);
  },
  benchmark: async () => {
    const questions = [
      {
        name: 'name',
        type: 'input',
        message: 'Enter benchmark name:',
      },
      {
        name: 'type',
        type: 'list',
        message: 'Deployment type:',
        choices: ['local']
      },
      {
        name: 'benchmark',
        type: 'list',
        message: 'Benchmark type:',
        choices: ['finality']
      },
      {
        name: 'startNodes',
        type: 'number',
        message: `Starting number of Polkadot nodes (${module.exports.defaults.minValidators}-${module.exports.defaults.maxValidators}):`,
        validate: (number) => number >= module.exports.defaults.minValidators && number <= module.exports.defaults.maxValidators,
      },
      {
        name: 'endNodes',
        type: 'number',
        message: `Ending number of Polkadot nodes (${module.exports.defaults.minValidators}-${module.exports.defaults.maxValidators}):`,
        validate: (number) => number >= module.exports.defaults.minValidators && number <= module.exports.defaults.maxValidators,
      },
      {
        name: 'measure',
        type: 'number',
        message: `Number of blocks to calculate the finality mean time (${module.exports.defaults.minFinalityBlocks}-${module.exports.defaults.maxFinalityBlocks}):`,
        default: module.exports.defaults.minFinalityBlocks,
        validate: (number) => number >= module.exports.defaults.minFinalityBlocks && number <= module.exports.defaults.maxFinalityBlocks,
      },
      {
        name: 'offset',
        type: 'number',
        message: 'Number of blocks to wait before starting measurements',
        default: 0,
        validate: (number) => number >= 0,
      }
    ];
    return inquirer.prompt(questions);
  },
  getConfig: async () => {
    const questions = [
      {
        name: 'name',
        type: 'input',
        message: 'Enter the new deployment name:',
        validate: async (name) => {
          const existing = await existingDeployments();

          if (existing.includes(name)) {
            console.log(`\n${name} deployment already exists, please pick another name`);
            return false;
          } else if (!name) {
            return false;
          } else {
            return true;
          }
        }
      },
    ];
    return inquirer.prompt(questions);
  },
};

async function existingDeployments() {
  const deployments = await db.list();

  let output = [];
  deployments.forEach((deployment) => {
    output.push(deployment.name);
  })
  return output;
}
