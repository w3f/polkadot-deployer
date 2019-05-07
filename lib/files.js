const chalk = require('chalk');
const fs = require('fs-extra');
const ospath = require('ospath');
const path = require('path');
const process = require('process');


module.exports = {
  dataPath: () => {
    return path.join(ospath.data(), 'polkadot-deployer');
  },
  componentsPath: () => {
    return path.join(module.exports.dataPath(), 'components');
  },
  deploymentsPath: () => {
    return path.join(module.exports.dataPath(), 'deployments');
  },
  deploymentsDBPath: () => {
    return path.join(module.exports.dataPath(), 'deployments.db');
  },
  deploymentPath: (name) => {
    return path.join(module.exports.deploymentsPath(), name);
  },
  kubeconfigPath: (name) => {
    return path.join(module.exports.deploymentPath(name), 'kubeconfig');
  },
  directoryExists: (dirPath) => {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch (err) {
      return false;
    }
  },
  fileExists: (filePath) => {
    try {
      return fs.statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  },
  createDirectory: (dirPath) => {
    if (!module.exports.directoryExists(dirPath)) {
      console.log(chalk.yellow(`Creating directory ${dirPath}...`));
      try {
        fs.mkdirSync(dirPath, {recursive: true});
      } catch(err) {
        console.error(`Could not create directory ${dirPath}: ${err.message}`);
        process.exit(1);
      }
      console.log(chalk.green('Done'));
    }
  },
  deleteDirectory: (dirPath) => {
    fs.removeSync(dirPath);
  },
  readJSON: (filePath) => {
    const rawContent = fs.readFileSync(filePath);

    return JSON.parse(rawContent);
  }
};
