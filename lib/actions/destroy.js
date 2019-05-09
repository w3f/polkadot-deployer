const chalk = require('chalk');
const process = require('process');

const cluster = require('../deployment/cluster');
const db = require('../db');
const files = require('../files');
const init = require('../init');
const inquirer = require('./inquirer');


module.exports = {
  do: async (name) => {
    const deployments = await db.list();
    if (deployments.length === 0) {
      console.log(chalk.yellow('No deployments found, try `polkadot-deployer create`'));
      process.exit(0);
    }

    await init.ensure();

    let config;
    if (name) {
      config = { name };
    } else {
      config = await inquirer.select();
    }

    const deployment = await db.find(config);
    if (!deployment) {
      console.log(chalk.yellow(`Deployment ${config.name} not found`));
      process.exit(1);
    }

    console.log(chalk.yellow(`Deleting ${config.name} cluster...`));
    await cluster.destroy(deployment);
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Deleting deployment directory...`));
    const deploymentPath = files.deploymentPath(config.name)
    files.deleteDirectory(deploymentPath);
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Deleting port-forward process...`));
    try {
      process.kill(-deployment.portForwardPID);
    } catch() {
      // FIXME: we are getting `unhandled-promise-rejection-rejection-id-1-error-kill-esrch`
      // here, but the detached process is removed
    }
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Removing database entry...`));
    await db.remove({ name: config.name });
    console.log(chalk.green('Done'));
  }
}
