const chalk = require('chalk');
const path = require('path');
const process = require('process');

const asyncUtils = require('./core/async');
const cmd = require('./core/cmd');
const download = require('./core/download');
const { Files } = require('./core/files');

module.exports = {
  ensure: async (config={}) => {
    const files = new Files(config);
    const dataPath = files.dataPath();
    files.createDirectory(dataPath);

    const componentsPath = files.componentsPath()
    files.createDirectory(componentsPath);

    const deploymentsPath = files.deploymentsPath()
    files.createDirectory(deploymentsPath);

    const mainConfig = files.readMainConfig();
    await asyncUtils.forEach(mainConfig.components, async (component) => {
      const componentPath = path.join(componentsPath, component.name);
      if(!files.fileExists(componentPath)) {
        console.log(chalk.yellow(`Downloading component ${component.name}...`));
        try {
          const url = component.url.replace(/%platform%/, process.platform);
          await download.file(url, componentPath);
        } catch(err) {
          console.error(`Could not download component ${component.name}: ${err.message}`);
          process.exit(1);
        }
        await cmd.exec(`chmod a+x ./${component.name}`, {cwd: componentsPath});
        console.log(chalk.green('Done'));
      }
    });
  }
}
