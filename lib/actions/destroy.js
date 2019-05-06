const chalk = require('chalk');

const init = require('../init');
const inquirer = require('../inquirer');


module.exports = {
  do: async () => {
    await init.ensure();

    const answers = await inquirer.destroy();
    console.log(chalk.yellow(`Destroying ${answers.name} deployment...`));
    console.log(chalk.green('Done'));
  }
}
