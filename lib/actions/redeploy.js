const chalk = require('chalk');
const process = require('process');

const db = require('../core/db');
const { Helm } = require('../clients/helm');
const init = require('../init');
const inquirer = require('./inquirer');
const portforward = require('../core/portforward');


module.exports = {
  do: async (name, cmd) => {
    await init.ensure();

    let config;
    if (name) {
      config = { name };
    } else {
      config = await inquirer.select();
    }

    config.verbose = cmd.verbose;

    const deployment = await db.find(config);
    if (!deployment) {
      console.log(chalk.yellow(`Deployment ${config.name} not found`));
      process.exit(1);
    }

    const helm = new Helm(deployment);

    console.log(chalk.yellow(`Redeploying ${config.name} deployment...`));
    await helm.redeploy();
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Updating port forward...`));

    portforward.delete(deployment)

    const result = portforward.create(deployment);

    deployment.portForwardPID= result.pid;
    deployment.wsEndpoint = result.wsEndpoint;
    await db.update(deployment);

    console.log(chalk.green('Done'));
  }
}
