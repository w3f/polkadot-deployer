const chalk = require('chalk');


module.exports = {
  install: async (config) => {
    console.log(chalk.yellow(`Installing polkadot chart for '${config.name}'...`));

    console.log(chalk.green('Done'));
  }
}
