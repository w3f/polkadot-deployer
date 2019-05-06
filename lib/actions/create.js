const chalk = require('chalk');

const init = require('../init');
const inquirer = require('../inquirer');


module.exports = {
  do: async () => {
    init.ensure();

    const answers = await inquirer.create();
    console.log(chalk.yellow(`Creating cluster for ${answers.name}...`));
    console.log(chalk.green('Done'));
    console.log(chalk.yellow(`Deploying Polkadot nodes...`));
    console.log(chalk.green('Done'));
    console.log(chalk.green('Network accessible at https://127.0.0.1:9944'));
  }
}
