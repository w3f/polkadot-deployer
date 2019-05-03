const inquirer = require('../inquirer');
const chalk = require('chalk');

module.exports = {
  do: async () => {
    const answers = await inquirer.destroy();
    console.log(chalk.yellow(`Destroying ${answers.name} deployment...`));
    console.log(chalk.green('Done'));
  }
}
