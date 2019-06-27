const chalk = require('chalk');
const fs = require('fs-extra');
const moment = require('moment');
const ospath = require('ospath');
const path = require('path');
const process = require('process');
const yaml = require('js-yaml');


class Files {
  constructor(config={}) {
    this.config = JSON.parse(JSON.stringify(config));
    if(!this.config.dataPath) {
      this.config.dataPath = ospath.data();
    }
  }

  dataPath () {
    return path.join(this.config.dataPath, 'polkadot-deployer');
  }

  componentsPath() {
    return path.join(this.dataPath(), 'components');
  }

  deploymentsPath () {
    return path.join(this.dataPath(), 'deployments');
  }

  deploymentsDBPath() {
    return path.join(this.dataPath(), 'deployments.db');
  }

  deploymentPath (name) {
    return path.join(this.deploymentsPath(), name);
  }

  kubeconfigPath (name) {
    return path.join(this.deploymentPath(name), 'kubeconfig');
  }

  deleteKubeconfig (name) {
    const kubeconfigPath = this.kubeconfigPath(name);
    fs.removeSync(kubeconfigPath);
  }
  valuesPath (name) {
    return path.join(this.deploymentPath(name), 'values');
  }
  absoluteValuesFilePath(name, index) {
    return path.join(this.valuesPath(name), `node-${index}.yaml`);
  }
  relativeValuesFilePath(name, index) {
    // path relative to components to prevent issues with spaces in paths
    return path.join('..', 'deployments', name, 'values', `node-${index}.yaml`);
  }
  directoryExists(dirPath) {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch (err) {
      return false;
    }
  }
  fileExists(filePath) {
    try {
      return fs.statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  }
  createDirectory(dirPath, options={}) {
    if (!this.directoryExists(dirPath)) {
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
  }
  deleteDirectory(dirPath) {
    fs.removeSync(dirPath);
  }
  createDeploymentDirectories(name) {
    const deploymentPath = this.deploymentPath(name);
    this.createDirectory(deploymentPath);

    const valuesPath = this.valuesPath(name);
    this.createDirectory(valuesPath);
  }
  deleteDeploymentDirectories(name) {
    const deploymentPath = this.deploymentPath(name);
    this.deleteDirectory(deploymentPath);
  }
  readJSON(filePath) {
    const rawContent = fs.readFileSync(filePath);

    return JSON.parse(rawContent);
  }
  projectConfigPath() {
    return path.join(path.dirname(module.filename), '..', '..', 'config');
  }
  readMainConfig() {
    const mainConfigPath = path.join(this.projectConfigPath(), 'main.json');
    return this.readJSON(mainConfigPath);
  }
  write(filePath, content, options = {}) {
    fs.writeFileSync(filePath, content, options);
  }
  writeJSON(filePath, data, options = {}) {
    this.createDirectory(path.dirname(filePath));
    this.write(filePath, JSON.stringify(data), options);
  }
  writeYAML(filePath, data) {
    this.createDirectory(path.dirname(filePath));
    this.write(filePath, yaml.safeDump(data));
  }
  writeBenchmarksData(config, results, outputPath='./') {
    const output = JSON.parse(JSON.stringify(config));
    output.data = results;

    this.createDirectory(outputPath);

    const fileName = this.benchmarkFilename(config);
    const outputFile = path.join(outputPath, fileName);
    this.write(outputFile, JSON.stringify(output));

    return path.resolve(outputFile);
  }
  writeBenchmarksPlot (config, data, outputPath='./') {
    this.createDirectory(outputPath);

    const fileName = this.benchmarkFilename(config, 'gnuplot');
    const outputFile = path.join(outputPath, fileName);

    this.write(outputFile, data);

    return path.resolve(outputFile);
  }
  benchmarkFilename (config, sufix='json') {
    const timestamp = moment().format('YYYYMMDD-hhmmss');
    return `polkadot-deployer.benchmark.${config.benchmark}.${timestamp}.${sufix}`;
  }
  terraformPath (name) {
    return path.join(this.deploymentPath(name), 'terraform');
  }
  terraformBinPath() {
    return path.join(this.componentsPath(), 'terraform');
  }
  terraformTplPath(type) {
    return path.join(path.dirname(module.filename), '..', '..', 'terraform', type);
  }
  copy (source, target) {
    fs.copySync(source, target);
  }
  copyTerraformFiles(name, type) {
    const source = this.terraformTplPath(type);

    if (!this.directoryExists(source)) {
      throw new Error(`Directory ${source} doesn't exist`);
    }

    const target = this.terraformPath(name);
    this.copy(source, target);

    const terraformBinSource = this.terraformBinPath();
    const terraformBinTarget = path.join(target, 'terraform');

    this.copy(terraformBinSource, terraformBinTarget);
  }
  chartValuesFileName(chart) {
    return `${chart}.yaml`;
  }
  chartValuesPath(name, chart) {
    const valuesFileName = this.chartValuesFileName(chart);

    return path.join(this.valuesPath(name), valuesFileName);
  }
  copyChartValuesFiles(name, chart) {
    const valuesFileName = this.chartValuesFileName(chart);

    const source = path.join(this.projectConfigPath(), 'charts', valuesFileName);

    if (!this.fileExists(source)) {
      throw new Error(`File ${source} doesn't exist`);
    }

    const target = this.chartValuesPath(name, chart);

    this.copy(source, target);
  }
}

module.exports = {
  Files
};
