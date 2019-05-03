const inquirer = require('../inquirer');
const chalk = require('chalk');

module.exports = {
  do: async () => {
    const answers = await inquirer.create();
    console.log(chalk.yellow(`Creating cluster for ${answers.name}...`));
    console.log(chalk.green('Done'));
    console.log(chalk.yellow(`Deploying Polkadot nodes...`));
    console.log(chalk.green('Done'));
    console.log(chalk.green('Network accessible at https://127.0.0.1:9944'));
  }
}
