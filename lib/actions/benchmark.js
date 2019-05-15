const chalk = require('chalk');
const process = require('process');

const files = require('../files');
const inquirer = require('./inquirer');


module.exports = {
  do: async (type, cmd) => {
    if (cmd.config) {
      config = files.readJSON(cmd.config);
      if (!validate(config)) {
        process.exit(1);
      }
    } else {
      config = await inquirer.benchmark();
    }
  }
}

function validate(config) {
  if (!config.name) {
    console.error(chalk.red(`'name' field must be provided`));
    return false;
  }
  if (!config.type) {
    console.error(chalk.red(`'type' field must be provided`));
    return false;
  }
  if (config.type !== 'local') {
    console.error(chalk.red(`'type' must be 'local'`));
    return false;
  }
  if (!config.benchmark) {
    console.error(chalk.red(`'benchmark' field must be provided`));
    return false;
  }
  if (config.benchmark !== 'finality') {
    console.error(chalk.red(`'type' must be 'finality'`));
    return false;
  }
  if (config.benchmark === 'finality') {
    if (!config.startNodes || !Number.isInteger(config.startNodes)) {
      console.error(chalk.red(`'startNodes' field must be an integer`));
      return false;
    }
    if (!config.endNodes || !Number.isInteger(config.startNodes)) {
      console.error(chalk.red(`'endNodes' field must be an integer`));
      return false;
    }
    if (config.startNodes > config.endNodes) {
      console.error(chalk.red(`'endNodes' must be greater than 'startNodes'`));
      return false;
    }
    if (config.startNodes < inquirer.defaults.minValidators) {
      console.error(chalk.red(`'startNodes' must be greater than ${inquirer.defaults.minValidators}`));
      return false;
    }
    if (config.endNodes < inquirer.defaults.maxValidators) {
      console.error(chalk.red(`'endNodes' must be lower than ${inquirer.defaults.maxValidators}`));
      return false;
    }

    if (!config.blocks || !Number.isInteger(config.blocks)) {
      console.error(chalk.red(`'blocks' field must be an integer`));
      return false;
    }
    if (config.blocks < inquirer.defaults.minFinalityBlocks) {
      console.error(chalk.red(`'blocks' must be greater than ${inquirer.defaults.minFinalityBlocks}`));
      return false;
    }
    if (config.blocks < inquirer.defaults.maxFinalityBlocks) {
      console.error(chalk.red(`'blocks' must be lower than ${inquirer.defaults.maxFinalityBlocks}`));
      return false;
    }
  }
  return true;
}
