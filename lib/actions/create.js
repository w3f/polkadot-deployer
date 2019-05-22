const chalk = require('chalk');
const process = require('process');

const cluster = require('../cluster');
const db = require('../core/db');
const files = require('../core/files');
const { Helm } = require('../clients/helm');
const init = require('../init');
const inquirer = require('./inquirer');
const keys = require('../network/keys');
const portforward = require('../core/portforward');


module.exports = {
  do: async (cmd) => {
    await init.ensure();

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
  if (config.type !== 'local') {
    console.error(chalk.red(`'type' must be 'local'`));
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
  if (deployment) {
    console.log(chalk.yellow(`Deployment ${config.name} already exists.`));
    process.exit(1);
  }

  files.createDeploymentDirectories(config.name);

  config.keys = await keys.createAndSave(config);

  console.log(chalk.yellow(`Creating cluster '${config.name}'...`));
  try {
    await cluster.create(config);
  } catch (err) {
    console.error(`Could not create cluster: ${err.message}`);
    await rollback(config);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  if (config.type === 'local') {
    config.workers = 1;
    config.provider = 'kind';
  }

  console.log(chalk.yellow('Initializing nodes...'));
  try {
    const helm = new Helm(config);
    await helm.install();
  } catch (err) {
    console.error(`Could not initialize nodes: ${err.message}`);
    await rollback(config);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  console.log(chalk.yellow(`Waiting for nodes ready...`));
  try {
    const result = await portforward.create(config);
    config.portForwardPID= result.pid;
    config.wsEndpoint = result.wsEndpoint;
  } catch (err) {
    console.error(`Could not forward port: ${err.message}`);
    await rollback(config);
    process.exit(1);
  }
  await db.save(config);
  console.log(chalk.green('Done'));
}

async function rollback(config) {
  await cluster.destroy(config);
  const deploymentPath = files.deploymentPath(config.name);
  files.deleteDirectory(deploymentPath);
}
