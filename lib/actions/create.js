const chalk = require('chalk');
const process = require('process');

const cluster = require('../deployment/cluster');
const db = require('../db');
const files = require('../files');
const { Helm } = require('../deployment/helm');
const init = require('../init');
const inquirer = require('./inquirer');
const { Kubectl } = require('../deployment/kubectl');


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

    console.log(chalk.yellow(`Installing polkadot chart for '${config.name}'...`));
    const helm = new Helm(config);
    await helm.install();
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Forwarding port...`));
    const kubectl = new Kubectl(config);
    const result = await kubectl.portForward('polkadot-node-0-0', 'app=polkadot-node-0', 9944);
    config.portForwardPID= result.pid;
    config.wsEndpoint = `http://localhost:${result.port}`;
    console.log(chalk.green('Done'));

    await db.save(config);
  } catch (err) {
    rollback(config);
    console.error(`Could not create cluster: ${err.message}`);
    process.exit(1);
  }
}

function rollback(config) {
  const deploymentPath = files.deploymentPath(config.name);
  files.deleteDirectory(deploymentPath);
}
