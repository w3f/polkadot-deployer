const chalk = require('chalk');
const inquirer = require('../actions/inquirer');


class Validation {
  constructor (config={}) {
    this.config = JSON.parse(JSON.stringify(config));
  }

  run(input) {
    if (!input.name) {
      console.error(chalk.red(`'name' field must be provided`));
      return false;
    }
  if (!input.type) {
    console.error(chalk.red(`'type' field must be provided`));
    return false;
  }
    if (!input.nodes) {
      console.error(chalk.red(`'nodes' field must be provided`));
      return false;
  }
    if (!inquirer.defaults.allowedTypes.includes(input.type)) {
      console.error(chalk.red(`'type' must be in ${inquirer.defaults.allowedTypes}`));
      return false;
    }
    if (!Number.isInteger(input.nodes) || input.nodes < 1 || input.nodes > inquirer.defaults.maxValidators) {
      console.error(chalk.red(`'nodes' must be an integer in the range [1, ${inquirer.defaults.maxValidators}]`));
      return false;
    }
    return true;
  }
}

module.exports = {
  Validation
}
