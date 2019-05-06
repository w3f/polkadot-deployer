const chalk = require('chalk');
const path = require('path');
const process = require('process');

const download = require('./download');
const files = require('./files');


module.exports = {
  ensure: async () => {
    const dataPath = files.dataPath();
    if (!files.directoryExists(dataPath)) {
      console.log(chalk.yellow('Creating data directory...'));
      try {
        files.createDataDirectory();
      } catch(err) {
        console.error(`Could not create data directory: ${err.message}`);
        process.exit(1);
      }
      console.log(chalk.green('Done'));
    }

    const componentsPath = files.componentsPath()
    if (!files.directoryExists(componentsPath)) {
      console.log(chalk.yellow('Creating data directory...'));
      try {
        files.createDataDirectory();
      } catch(err) {
        console.error(`Could not create data directory: ${err.message}`);
        process.exit(1);
      }
      console.log(chalk.green('Done'));
    }

    const components = files.readJSON('../config/components.json');
    for (const component in components.items) {
      const componentPath = path.join(componentsPath, component.name);
      if(!files.fileExist(componentPath)) {
        console.log(chalk.yellow(`Downloading component ${component.name}...`));
        try {
          await download.component(component.url, componentsPath);
        } catch(err) {
          console.error(`Could not download component ${component.name}: ${err.message}`);
          process.exit(1);
        }
        console.log(chalk.green('Done'));
      }
    }
  }
}
