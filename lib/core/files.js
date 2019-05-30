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
  deleteKubeconfig: (name) => {
    const kubeconfigPath = module.exports.kubeconfigPath(name);
    fs.removeSync(kubeconfigPath);
  },
  valuesPath: (name) => {
    return path.join(module.exports.deploymentPath(name), 'values');
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
  createDirectory: (dirPath, options={}) => {
    if (!module.exports.directoryExists(dirPath)) {
      if (options.verbose) {
        console.log(chalk.yellow(`Creating directory ${dirPath}...`));
      }
      try {
        fs.mkdirSync(dirPath, {recursive: true});
      } catch(err) {
        console.error(`Could not create directory ${dirPath}: ${err.message}`);
        process.exit(1);
      }
      if (options.verbose) {
        console.log(chalk.green('Done'));
      }
    }
  },
  deleteDirectory: (dirPath) => {
    fs.removeSync(dirPath);
  },
  createDeploymentDirectories: (name) => {
    const deploymentPath = module.exports.deploymentPath(name);
    module.exports.createDirectory(deploymentPath);

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
  write: (filePath, content, options = {}) => {
    fs.writeFileSync(filePath, content, options);
  },
  writeJSON: (filePath, data, options = {}) => {
    module.exports.createDirectory(path.dirname(filePath));
    module.exports.write(filePath, JSON.stringify(data), options);
  },
  writeYAML(filePath, data) {
    module.exports.createDirectory(path.dirname(filePath));
    module.exports.write(filePath, yaml.safeDump(data));
  },
  writeBenchmarksData(config, results, outputPath='./') {
    const output = JSON.parse(JSON.stringify(config));
    output.data = results;

    module.exports.createDirectory(outputPath);

    const fileName = module.exports.benchmarkFilename(config);
    const outputFile = path.join(outputPath, fileName);
    module.exports.write(outputFile, JSON.stringify(output));

    return path.resolve(outputFile);
  },
  writeBenchmarksPlot: (config, data, outputPath='./') => {
    module.exports.createDirectory(outputPath);

    const fileName = module.exports.benchmarkFilename(config, 'gnuplot');
    const outputFile = path.join(outputPath, fileName);

    module.exports.write(outputFile, data);

    return path.resolve(outputFile);
  },
  benchmarkFilename: (config, sufix='json') => {
    const timestamp = moment().format('YYYYMMDD-hhmmss');
    return `polkadot-deployer.benchmark.${config.benchmark}.${timestamp}.${sufix}`;
  },
  terraformPath: (name) => {
    return path.join(module.exports.deploymentPath(name), 'terraform');
  },
  terraformBinPath: () => {
    return path.join(module.exports.componentsPath(), 'terraform');
  },
  terraformTplPath: (type) => {
    return path.join(path.dirname(module.filename), '..', '..', 'terraform', type);
  },
  copyTerraformFiles: (name, type) => {
    const source = module.exports.terraformTplPath(type);

    if (!module.exports.directoryExists(source)) {
      throw new Error(`Directory ${source} doesn't exist`);
    }

    const target = module.exports.terraformPath(name);

    fs.copySync(source, target);

    const terraformBinSource = module.exports.terraformBinPath();
    const terraformBinTarget = path.join(target, 'terraform');

    fs.copySync(terraformBinSource, terraformBinTarget);
  }
};
