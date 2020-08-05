const chalk = require('chalk');
const process = require('process');

const cfg = require('../core/cfg');
const { Cluster } = require('../cluster');
const db = require('../core/db');
const { Files } = require('../core/files');
const init = require('../init');
const inquirer = require('./inquirer');
const crypto = require('../network/crypto');
const libp2p = require('../network/libp2p');
const strings = require('../core/strings');
const { Validation } = require('../validation');

module.exports = {
  do: async (cmd) => {
    let config;
    if (cmd.config) {
      try {
        config = cfg.read(cmd.config);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
      const validator = new Validation()
      if (!validator.run(config)) {
        process.exit(1);
      }
    } else {
      config = await inquirer.create();
    }

    config.verbose = cmd.verbose;
    config.update = cmd.update;
    config.dataPath = cmd.data;

    await init.ensure(config);

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
      config.nonValidatorIndices = [];
    }
    if (!config.extraArgs) {
      config.extraArgs = "";
    }

    // create custom chainspec if not explicitly disabled.
    if (config.chainspec === undefined) {
      config.chainspec= {};
    }
    if (config.chainspec.custom === undefined) {
      config.chainspec.custom = true;
    }

    return create(config);
  }
}

async function create(config) {
  const deployment = await db.find(config);
  const files = new Files(config);
  if (deployment && !config.update) {
    console.log(chalk.yellow(`Deployment ${config.name} already exists.`));
    //process.exit(1);
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

  if (!config.environmentKeys) {
    console.log(chalk.green(keysBanner(config.keys, config.nodeKeys)));
  }

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

  /*
  if (config.type !== 'local') {
    files.deleteKubeconfig(config.name);
  }
  */
}

async function rollback(config, cluster) {
  if (!config.keep) {
    const files = new Files(config);
    await cluster.destroy();
    const deploymentPath = files.deploymentPath(config.name);
    files.deleteDirectory(deploymentPath);
  }
}

function keysBanner(keys, nodeKeys) {
  const starLine = `*******************************************************************************`
  let keysString = '';
  const keyTypes = crypto.keyTypes();
  const totalKeys = keys[keyTypes[0]].length;
  for (let counter = 0; counter < totalKeys; counter++) {
    keyTypes.forEach((type) => {
      keysString += `
export POLKADOT_DEPLOYER_KEYS_${counter}_${type.toUpperCase()}_ADDRESS=${keys[type][counter].address}
export POLKADOT_DEPLOYER_KEYS_${counter}_${type.toUpperCase()}_SEED=${keys[type][counter].seed}
`;
    });
  }
  let nodesString = '';
  for (let counter = 0; counter < nodeKeys.length; counter++) {
    nodesString +=`
export POLKADOT_DEPLOYER_NODE_KEYS_${counter}_KEY=${nodeKeys[counter].nodeKey}
export POLKADOT_DEPLOYER_NODE_KEYS_${counter}_PEER_ID=${nodeKeys[counter].peerId}
`
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

${nodesString}

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
