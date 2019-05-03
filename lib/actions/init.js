const chalk = require('chalk');
const process = require('process');

const download = require('../download');
const files = require('../files');


module.exports = {
  do: async () => {
    console.log(chalk.yellow('Creating data directory...'));
    try {
      files.createDataDirectory();
    } catch(err) {
      console.error(`Could not create data directory: ${err.message}`);
      process.exit(1);
    }
    console.log(chalk.green('Done'));

    console.log(chalk.yellow('Downloading components...'));
    try {
      let componentsPath = files.componentsPath();
      await download.components(componentsPath);
    } catch(err) {
      console.error(`Could not download components: ${err.message}`);
      process.exit(1);
    }
    console.log(chalk.green('Done'));
  }
}
