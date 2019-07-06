const chalk = require('chalk');
const process = require('process');

const { Cluster } = require('../cluster');
const db = require('../core/db');
const { Files } = require('../core/files');
const init = require('../init');
const inquirer = require('./inquirer');
const crypto = require('../network/crypto');
const libp2p = require('../network/libp2p');
const strings = require('../core/strings');


module.exports = {
  do: async (cmd) => {
    await init.ensure();
    const files = new Files();

    let config;
    if (cmd.config) {
      config = files.readJSON(cmd.config);
      if (!validate(config)) {
        process.exit(1);
      }
    } else {
      config = await inquirer.create();
    }

    config.verbose = cmd.verbose;
    config.name = strings.removeSpaces(config.name)
    if (config.type === 'local') {
      config.workers = 1;
      config.provider = 'kind';
    } else {
      // give 1 more worker for auxiliar services.
      config.workers = config.nodes + 1;
      config.provider = config.type;
    }
    if (!config.nonValidatorIndices) {
      config.nonValidatorIndices = []
    }

    // create custom chainspec if not explicitly disabled.
    if (config.customChainspec === undefined) {
      config.customChainspec = true;
    }

    return create(config);
  }
}

function validate(config) {
  if (!config.name) {
    console.error(chalk.red(`'name' field must be provided`));
    return false;
  }
  if (!config.type) {
    console.error(chalk.red(`'type' field must be provided`));
    return false;
  }
  if (!config.nodes) {
    console.error(chalk.red(`'nodes' field must be provided`));
    return false;
  }
  if (!inquirer.defaults.allowedTypes.includes(config.type)) {
    console.error(chalk.red(`'type' must be in ${inquirer.defaults.allowedTypes}`));
    return false;
  }
  if (!Number.isInteger(config.nodes) || config.nodes < 1 || config.nodes > inquirer.defaults.maxValidators) {
    console.error(chalk.red(`'nodes' must be an integer in the range [1, ${inquirer.defaults.maxValidators}]`));
    return false;
  }
  return true;
}

async function create(config) {
  const deployment = await db.find(config);
  const files = new Files(config);
  if (deployment) {
    console.log(chalk.yellow(`Deployment ${config.name} already exists.`));
    process.exit(1);
  }
  files.createDeploymentDirectories(config.name);

  const numberOfKeys = getNumberOfKeys(config);
  config.keys = await crypto.create(numberOfKeys, config.environmentKeys);
  config.nodeKeys = await libp2p.createNodeKeys(config.nodes, config.environmentNodeKeys);

  console.log(chalk.yellow(`Creating cluster '${config.name}'...`));
  const cluster = new Cluster(config);

  try {
    await cluster.create();
  } catch (err) {
    console.error(`Could not create cluster: ${err.message}`);
    await rollback(config, cluster);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  console.log(chalk.yellow('Installing dependencies...'));
  try {
    await cluster.installDeps();
  } catch (err) {
    console.error(`Could not install dependencies: ${err.message}`);
    await rollback(config, cluster);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  console.log(chalk.yellow('Initializing nodes...'));
  try {
    await cluster.installNodes();
  } catch (err) {
    console.error(`Could not initialize nodes: ${err.message}`);
    await rollback(config, cluster);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  await db.save(config);

  console.log(chalk.yellow(`Waiting for nodes ready...`));
  try {
    const result = await cluster.waitReady();
    config.portForwardPID= result.pid;
    config.wsEndpoint = result.wsEndpoint;
  } catch (err) {
    console.error(`Could not forward port: ${err.message}`);
    await rollback(config, cluster);
    process.exit(1);
  }

  console.log(chalk.green('Done'));

  console.log(chalk.green(keysBanner(config.keys)));

  /*
  if (config.type !== 'local') {
    files.deleteKubeconfig(config.name);
  }
  */
}

async function rollback(config, cluster) {
  const files = new Files(config);
  await cluster.destroy();
  const deploymentPath = files.deploymentPath(config.name);
  files.deleteDirectory(deploymentPath);
}

function keysBanner(keys) {
  const starLine = `*******************************************************************************`
  let keysString = '';
  const keyTypes = crypto.keyTypes();
  const nodes = keys[keyTypes[0]].length;
  for (let counter = 0; counter < nodes; counter++) {
    keysString += `
Node ${counter}:`;
    keyTypes.forEach((type) => {
      keysString += `
  - ${type}:
    address: ${keys[type][counter].address}
    seed: ${keys[type][counter].seed}
`;
    });
  }

  return `

${starLine}
${starLine}

 IMPORTANT: the raw seeds for the created accounts will be shown next.

 These seeds allow to gain control over the accounts represented by
 the keys. If you plan to use the new cluster for other than testing
 or trying the technology, please keep them safe. If you lose these
 seeds you won't be able to access the accounts. If anyone founds them,
 they can gain control over the accounts and any funds (test or real DOTs)
 stored in them.

${keysString}

${starLine}
${starLine}
`
}

function getNumberOfKeys(config) {
  let output = config.nodes;

  if (config.remote && config.remote.clusters) {
    output -= config.nonValidatorIndices.length * config.remote.clusters.length;
  }

  return output;
}
