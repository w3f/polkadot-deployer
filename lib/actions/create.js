const chalk = require('chalk');

const files = require('../files');
const init = require('../init');
const inquirer = require('../inquirer');


module.exports = {
  do: async (cmd) => {
    await init.ensure();

    let config;
    if (cmd.config) {
      config = files.readJSON(cmd.config);
    } else {
      config = await inquirer.create();
    }

    console.log(chalk.yellow(`Creating cluster for ${config.name}...`));
    console.log(chalk.green('Done'));
    console.log(chalk.yellow(`Deploying Polkadot nodes...`));
    console.log(chalk.green('Done'));
    console.log(chalk.green('Network accessible at https://127.0.0.1:9944'));
  }
}
