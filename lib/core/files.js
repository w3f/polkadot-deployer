const chalk = require('chalk');
const fs = require('fs-extra');
const moment = require('moment');
const ospath = require('ospath');
const path = require('path');
const process = require('process');
const yaml = require('js-yaml');


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
  absoluteValuesFilePath: (name, index) => {
    return path.join(module.exports.valuesPath(name), `node-${index}.yaml`);
  },
  relativeValuesFilePath: (name, index) => {
    // path relative to components to prevent issues with spaces in paths
    return path.join('..', 'deployments', name, 'values', `node-${index}.yaml`);
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
  readMainConfig: () => {
    const configPath = path.join(path.dirname(module.filename), '..', '..', 'config', 'main.json');
    return module.exports.readJSON(configPath);
  },
  writeJSON: (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data));
  },
  writeYAML(filePath, data) {
    fs.writeFileSync(filePath, yaml.safeDump(data));
  },
  writeBenchmarksData(config, results, outputPath='./') {
    const output = JSON.parse(JSON.stringify(config));
    output.data = results;

    module.exports.createDirectory(outputPath);

    const fileName = module.exports.benchmarkFilename(config);
    const outputFile = path.join(outputPath, fileName);
    fs.writeFileSync(outputFile, JSON.stringify(output));

    return path.resolve(outputFile);
  },
  writeBenchmarksPlot: (config, data, outputPath='./') => {
    module.exports.createDirectory(outputPath);

    const fileName = module.exports.benchmarkFilename(config, 'gnuplot');
    const outputFile = path.join(outputPath, fileName);

    fs.writeFileSync(outputFile, data);

    return path.resolve(outputFile);
  },
  benchmarkFilename: (config, sufix='json') => {
    const timestamp = moment().format('YYYYMMDD-hhmmss');
    return `polkadot-deployer.benchmark.${config.benchmark}.${timestamp}.${sufix}`;
  }
};
