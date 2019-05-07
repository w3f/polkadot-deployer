const chalk = require('chalk');
const process = require('process');

const cluster = require('../deployment/cluster');
const db = require('../db');
const files = require('../files');
const helm = require('../deployment/helm');
const init = require('../init');
const inquirer = require('./inquirer');


module.exports = {
  do: async (cmd) => {
    await init.ensure();

    let config;
    if (cmd.config) {
      config = files.readJSON(cmd.config);
    } else {
      config = await inquirer.create();
    }

    return create(config);
  }
}

async function create(config) {
  const deployment = await db.find(config);
  if (deployment) {
    console.log(chalk.yellow(`Deployment ${config.name} already exists.`));
    process.exit(1);
  }

  const deploymentPath = files.deploymentPath(config.name);
  files.createDirectory(deploymentPath);

  try {
    if (config.type === 'local') {
      console.log(chalk.yellow(`Creating local cluster '${config.name}'...`));
      await cluster.createLocal(config);
      console.log(chalk.green('Done'));
      config.workers = 1;
      config.provider = 'kind';
    } else {
      await cluster.createRemote(config);
    }
    await helm.install(config);

    await db.save(config);
  } catch (err) {
    await rollback(config);
    process.exit(1);
  }
}

async function rollback(config) {
  const deploymentPath = files.deploymentPath(config.name);
  files.deleteDirectory(deploymentPath);
}
