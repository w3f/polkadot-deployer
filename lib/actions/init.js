const chalk = require('chalk');

module.exports = {
  do: () => {
    console.log(chalk.yellow('Creating data directory...'));
    console.log(chalk.green('Done'));
    console.log(chalk.yellow('Downloading components...'));
    console.log(chalk.green('Done'));
  }
}
