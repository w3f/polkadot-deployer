const chalk = require('chalk');
const process = require('process');

const { Benchmarks } = require('../benchmarks');
const cluster = require('../cluster');
const db = require('../local/db');
const files = require('../local/files');
const { Helm } = require('../clients/helm');
const inquirer = require('./inquirer');
const keys = require('../network/keys');
const portforward = require('../local/portforward');


module.exports = {
  do: async (cmd) => {
    let config;
    if (cmd.config) {
      config = files.readJSON(cmd.config);
      if (!validate(config)) {
        process.exit(1);
      }
    } else {
      config = await inquirer.benchmark();
    }

    return benchmark(config, cmd.output);
  }
}

function validate(config) {
  if (!config.name) {
    console.error(chalk.red(`'name' field must be provided`));
    return false;
  }
  if (!config.type) {
    console.error(chalk.red(`'type' field must be provided`));
    return false;
  }
  if (config.type !== 'local') {
    console.error(chalk.red(`'type' must be 'local'`));
    return false;
  }
  if (!config.benchmark) {
    console.error(chalk.red(`'benchmark' field must be provided`));
    return false;
  }
  if (config.benchmark !== 'finality') {
    console.error(chalk.red(`'type' must be 'finality'`));
    return false;
  }
  if (config.benchmark === 'finality') {
    if (!config.startNodes || !Number.isInteger(config.startNodes)) {
      console.error(chalk.red(`'startNodes' field must be an integer`));
      return false;
    }
    if (!config.endNodes || !Number.isInteger(config.startNodes)) {
      console.error(chalk.red(`'endNodes' field must be an integer`));
      return false;
    }
    if (config.startNodes > config.endNodes) {
      console.error(chalk.red(`'endNodes' must be greater than 'startNodes'`));
      return false;
    }
    if (config.startNodes < inquirer.defaults.minValidators) {
      console.error(chalk.red(`'startNodes' must be greater than ${inquirer.defaults.minValidators}`));
      return false;
    }
    if (config.endNodes > inquirer.defaults.maxValidators) {
      console.error(chalk.red(`'endNodes' must be lower than ${inquirer.defaults.maxValidators}`));
      return false;
    }

    if (!config.blocks || !Number.isInteger(config.blocks)) {
      console.error(chalk.red(`'blocks' field must be an integer`));
      return false;
    }
    if (config.blocks < inquirer.defaults.minFinalityBlocks) {
      console.error(chalk.red(`'blocks' must be greater than ${inquirer.defaults.minFinalityBlocks}`));
      return false;
    }
    if (config.blocks > inquirer.defaults.maxFinalityBlocks) {
      console.error(chalk.red(`'blocks' must be lower than ${inquirer.defaults.maxFinalityBlocks}`));
      return false;
    }
  }
  return true;
}

async function benchmark(config, output) {
  const deployment = await db.find(config);
  if (deployment) {
    console.log(chalk.yellow(`Deployment ${config.name} already exists.`));
    process.exit(1);
  }

  files.createDeploymentDirectories(config.name);

  console.log(chalk.yellow(`Creating cluster '${config.name}'...`));
  try {
    await cluster.create(config);
  } catch (err) {
    console.error(`Could not create cluster: ${err.message}`);
    await rollback(config);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  const helm = new Helm(config);
  const results = [];
  for (let counter = config.startNodes; counter <= config.endNodes; counter++) {
    const partialResult = await getResults(helm, config, counter);
    results.push(partialResult);
  }
  console.log(chalk.yellow(`Destroying cluster '${config.name}'...`));
  await cluster.destroy(config);
  console.log(chalk.green('Done'));

  console.log(chalk.yellow(`Deleting deployment directory...`));
  files.deleteDeploymentDirectories(config.name);
  console.log(chalk.green('Done'));

  const benchmarkFile = files.writeBenchmarks(config.name, config.type, results, output);
  console.log(chalk.green(`Results writen to ${benchmarkFile}`));
}

async function getResults(helm, baseConfig, nodes) {
  // clone config object
  const config = JSON.parse(JSON.stringify(baseConfig));
  config.nodes = nodes;
  config.keys = await keys.createAndSave(config);

  helm.setConfig(config);

  console.log(chalk.green('***************************************'));
  console.log(chalk.green(` Starting benchmarks with ${nodes} nodes`));
  console.log(chalk.green('***************************************'));
  try {
    await helm.install();
  } catch (err) {
    console.error(`Could not install polkadot chart: ${err.message}`);
    await rollback(config);
    process.exit(1);
  }

  console.log(chalk.yellow('Forwarding port...'));
  const portForwardResult = await portforward.create(config, {quiet: true});
  console.log(chalk.green('Done'));

  // get metrics
  const bm = new Benchmarks(config);
  const metrics = await bm.metrics();

  // delete charts
  await helm.delete();

  // remove port forward
  await portforward.delete(portForwardResult.pid);

  console.log(chalk.green('Done'));

  return metrics;
}

async function rollback(config) {
  await cluster.destroy(config);
}
