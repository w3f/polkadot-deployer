const chalk = require('chalk');
const process = require('process');

const db = require('../db');
const { Helm } = require('../deployment/helm');
const init = require('../init');
const inquirer = require('./inquirer');


module.exports = {
  do: async (name) => {
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

    const helm = new Helm(deployment);

    console.log(chalk.yellow(`Redeploying ${config.name} deployment...`));
    await helm.redeploy();
    console.log(chalk.green('Done'));
  }
}
