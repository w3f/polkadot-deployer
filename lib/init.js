const chalk = require('chalk');
const path = require('path');
const process = require('process');

const cmd = require('./cmd');
const download = require('./download');
const files = require('./files');


module.exports = {
  ensure: async () => {
    const dataPath = files.dataPath();
    files.createDirectory(dataPath);

    const componentsPath = files.componentsPath()
    files.createDirectory(componentsPath);

    const deploymentsPath = files.deploymentsPath()
    files.createDirectory(deploymentsPath);

    const componentsConfigPath = path.join(path.dirname(module.filename), '..', 'config', 'components.json');
    const components = files.readJSON(componentsConfigPath);
    await asyncForEach(components.items, async (component) => {
      const componentPath = path.join(componentsPath, component.name);
      if(!files.fileExists(componentPath)) {
        console.log(chalk.yellow(`Downloading component ${component.name}...`));
        try {
          await download.component(component.url, componentPath);
        } catch(err) {
          console.error(`Could not download component ${component.name}: ${err.message}`);
          process.exit(1);
        }
        await cmd.exec(`chmod a+x ${componentPath}`);
        console.log(chalk.green('Done'));
      }
    });
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
