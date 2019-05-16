const chalk = require('chalk');
const fs = require('fs-extra');
const yaml = require('js-yaml');
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
  keysPath: (name) => {
    return path.join(module.exports.deploymentPath(name), 'keys');
  },
  valuesPath: (name) => {
    return path.join(module.exports.deploymentPath(name), 'values');
  },
  keyPath: (name, index, type) => {
    return path.join(module.exports.keysPath(name), `node-${index}-${type}.json`);
  },
  valuesFilePath: (name, index) => {
    return path.join(module.exports.valuesPath(name), `node-${index}.yaml`);
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
  createDeploymentDirectories: (name) => {
    const deploymentPath = module.exports.deploymentPath(name);
    module.exports.createDirectory(deploymentPath);

    const keysPath = module.exports.keysPath(name);
    module.exports.createDirectory(keysPath);

    const valuesPath = module.exports.valuesPath(name);
    module.exports.createDirectory(valuesPath);
  },
  deleteDeploymentDirectories: (name) => {
    const deploymentPath = module.exports.deploymentPath(name);
    module.exports.deleteDirectory(deploymentPath);
  },
  readJSON: (filePath) => {
    const rawContent = fs.readFileSync(filePath);

    return JSON.parse(rawContent);
  },
  writeJSON: (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data));
  },
  writeYAML(filePath, data) {
    fs.writeFileSync(filePath, yaml.safeDump(data));
  },
  writeBenchmarks(name, type, data, filePath) {

  },
};
