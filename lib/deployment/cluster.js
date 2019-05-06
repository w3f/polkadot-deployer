const chalk = require('chalk');


module.exports = {
  createLocal: async (config) => {
    console.log(chalk.yellow(`Creating local cluster '${config.name}'...`));

    console.log(chalk.green('Done'));
  },

  createRemote: async (config) => {
    console.log(chalk.yellow(`Creating remote cluster '${config.name}'...`));

    console.log(chalk.green('Done'));
  }
}
