const chalk = require('chalk');
const process = require('process');

const cfg = require('../core/cfg');
const { Cluster } = require('../cluster');
const db = require('../core/db');
const { Files } = require('../core/files');
const init = require('../init');
const inquirer = require('./inquirer');


module.exports = {
  do: async (name, cmd) => {
    await init.ensure();

    let config;
    if (cmd.config) {
      config = cfg.readAndCatch(cmd.config)
      if (!config.name) {
        console.log(chalk.yellow(`Provided config in ${cmd.config} doesn't have a name field`));
        process.exit(1);
      }
    } else if (name) {
      config = { name };
    } else {
      config = await inquirer.select();
    }

    config.verbose = cmd.verbose;
    config.dataPath = cmd.data;

    let deployment;
    if (!cmd.config) {
      deployment = await db.find(config);
      if (!deployment) {
        console.log(chalk.yellow(`Deployment ${config.name} not found`));
        process.exit(1);
      }
    } else {
      deployment = config;
    }

    const files = new Files(deployment);

    console.log(chalk.yellow(`Deleting ${config.name} cluster...`));
    deployment.verbose = config.verbose;
    const cluster = new Cluster(deployment);
    await cluster.destroy();
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Deleting deployment directory...`));
    files.deleteDeploymentDirectories(config.name);
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Removing database entry...`));
    await db.remove({ name: config.name });
    console.log(chalk.green('Done'));
  }
}
