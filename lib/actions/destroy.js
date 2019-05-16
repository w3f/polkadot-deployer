const chalk = require('chalk');
const process = require('process');

const cluster = require('../cluster');
const db = require('../local/db');
const files = require('../local/files');
const init = require('../init');
const inquirer = require('./inquirer');
const portforward = require('../local/portforward');


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
    files.deleteDeploymentDirectories(config.name);
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Deleting port-forward process...`));
    portforward.delete(deployment)
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Removing database entry...`));
    await db.remove({ name: config.name });
    console.log(chalk.green('Done'));
  }
}
