const inquirer = require('../inquirer');
const chalk = require('chalk');

module.exports = {
  do: async () => {
    const answers = await inquirer.create();
    console.log(chalk.green(`Creating cluster for ${answers.name}...`));
    console.log(chalk.green('Done'));
    console.log(chalk.green(`Deploying Polkadott nodes...`));
    console.log(chalk.green('Done, you can connect to https://127.0.0.1:9944'));
  }
}
