const chalk = require('chalk');
const process = require('process');

const asyncUtils = require('../core/async');
const { Benchmarks } = require('../benchmarks');
const cfg = require('../core/cfg');
const { Cluster } = require('../cluster');
const db = require('../core/db');
const { Files } = require('../core/files');
const init = require('../init');
const inquirer = require('./inquirer');
const keys = require('../network/crypto');
const libp2p = require('../network/libp2p');
const plot = require('../benchmarks/plot');
const portforward = require('../core/portforward');
const strings = require('../core/strings');


module.exports = {
  do: async (cmd) => {
    await init.ensure();
    let config;
    if (cmd.config) {
      config = cfg.readAndCatch(cmd.config)
      config.sets = initializeSets(config);
      if (!validate(config)) {
        process.exit(1);
      }
    } else {
      const inputConfig = await inquirer.benchmark();
      config = inputConfig;
      config.blocks = {measure: inputConfig.measure, offset: inputConfig.offset};
    }
    config.verbose = cmd.verbose;
    config.name = strings.removeSpaces(config.name)
    if (config.type === 'local') {
      config.workers = 1;
      config.provider = 'kind';
    } else {
      config.workers = config.sets[config.sets.length - 1];
      config.provider = config.type;
    }

    if (!config.extraArgs) {
      config.extraArgs = "";
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
  if (!inquirer.defaults.allowedTypes.includes(config.type)) {
    console.error(chalk.red(`'type' must be in ${inquirer.defaults.allowedTypes}`));
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
    if (!Array.isArray(config.sets) || config.sets.length == 0) {
      console.error(chalk.red('sets must be a non-empty array'));
      return false;
    }
    const startNodes = config.sets[0];
    const endNodes = config.sets[config.sets.length - 1];
    if (!limitsValidation(startNodes, endNodes)) {
      return false;
    }

    if (!config.blocks.measure || !Number.isInteger(config.blocks.measure)) {
      console.error(chalk.red(`'blocks.measure' field must be an integer`));
      return false;
    }
    if (config.blocks.measure < inquirer.defaults.minFinalityBlocks) {
      console.error(chalk.red(`'blocks.measure' must be greater than ${inquirer.defaults.minFinalityBlocks}`));
      return false;
    }
    if (config.blocks.measure > inquirer.defaults.maxFinalityBlocks) {
      console.error(chalk.red(`'blocks.measure' must be lower than ${inquirer.defaults.maxFinalityBlocks}`));
      return false;
    }
    if (config.blocks.offset && !Number.isInteger(config.blocks.offset)) {
      console.error(chalk.red(`'blocks.offset' field must be an integer`));
      return false;
    }
  }
  return true;
}

function limitsValidation(startNodes, endNodes) {
  if (!startNodes || !Number.isInteger(startNodes)) {
    console.error(chalk.red(`'startNodes' field must be an integer`));
    return false;
  }
  if (!endNodes || !Number.isInteger(endNodes)) {
    console.error(chalk.red(`'endNodes' field must be an integer`));
    return false;
  }
  if (startNodes > endNodes) {
    console.error(chalk.red(`'endNodes' must be greater than 'startNodes'`));
    return false;
  }
  if (startNodes < inquirer.defaults.minValidators) {
    console.error(chalk.red(`'startNodes' must be greater than ${inquirer.defaults.minValidators}`));
    return false;
  }
  if (endNodes > inquirer.defaults.maxValidators) {
    console.error(chalk.red(`'endNodes' must be lower than ${inquirer.defaults.maxValidators}`));
    return false;
  }
  return true;
}

async function benchmark(config, output) {
  const cluster = new Cluster(config);
  const create = await shouldCreate(config);
  const files = new Files(config);
  if (create) {
    const deployment = await db.find(config);
    if (deployment) {
      console.log(chalk.yellow(`Deployment ${config.name} already exists.`));
      process.exit(1);
    }

    files.createDeploymentDirectories(config.name);

    console.log(chalk.yellow(`Creating cluster '${config.name}'...`));
    try {
      await cluster.create();
    } catch (err) {
      console.error(`Could not create cluster: ${err.message}`);
      await rollback(config, cluster);
      process.exit(1);
    }
    await db.save(config);
    console.log(chalk.green('Done'));

    console.log(chalk.yellow('Installing dependencies...'));
    try {
      await cluster.installDeps();
    } catch (err) {
      console.error(`Could not install dependencies: ${err.message}`);
      process.exit(1);
    }
    console.log(chalk.green('Done'));
  }

  const results = [];
  await asyncUtils.forEach(config.sets, async (counter) => {
    const partialResult = await getResults(cluster, config, counter);
    if (partialResult.length > 0) {
      results.push({"validators": counter, "results": partialResult});
    }
  });

  const dataFile = files.writeBenchmarksData(config, results, output);
  const plotData = plot.create(results);
  const plotFile = files.writeBenchmarksPlot(config, plotData, output);
  console.log(chalk.green(`Results writen to ${dataFile}`));
  console.log(chalk.green(`gnuplot writen to ${plotFile}`));

  if (!config.reuseCluster) {
    console.log(chalk.yellow(`Destroying cluster '${config.name}'...`));
    try {
      await cluster.destroy();
    } catch (e) {
      console.error(`Could not destroy cluster: ${e.message}`);
    }
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Deleting deployment directory...`));
    files.deleteDeploymentDirectories(config.name);
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Removing database entry...`));
    await db.remove({ name: config.name });
    console.log(chalk.green('Done'));
  }
}

async function getResults(cluster, config, nodes) {
  cluster.setNodes(nodes);

  const accountKeys = await keys.create(nodes);
  cluster.setKeys(accountKeys);

  const nodeKeys = await libp2p.createNodeKeys(nodes);
  cluster.setNodeKeys(nodeKeys);

  console.log(chalk.yellow('Initializing nodes...'));
  try {
    await cluster.installNodes();
  } catch (err) {
    console.error(`Could not initialize nodes: ${err.message}`);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  console.log(chalk.yellow('Waiting for nodes ready...'));
  let portForwardResult;
  try {
    portForwardResult = await cluster.waitReady();
  } catch (e) {
    console.error(`Could not wait for ready: ${e.message}`);
    process.exit(1);
  }
  console.log(chalk.green('Done'));

  console.log(chalk.green('***************************************'));
  console.log(chalk.green(` Starting benchmarks with ${nodes} nodes`));
  console.log(chalk.green('***************************************'));
  const bmConfig = {
    type: config.benchmark,
    wsEndpoint: portForwardResult.wsEndpoint,
    blocks: config.blocks
  }
  const bm = new Benchmarks(bmConfig);
  const metrics = await bm.metrics();
  console.log(chalk.green('***************************************'));
  console.log(chalk.green(` Finished benchmarks with ${nodes} nodes`));
  console.log(chalk.green('***************************************'));

  // delete charts
  try {
    await cluster.deleteNodes();
  } catch (e) {
    console.log(`Could not delete charts: ${e.message}`)
  }

  // remove port forward
  await portforward.delete(portForwardResult.pid);

  console.log(chalk.green('Done'));

  return metrics;
}

async function rollback(config, cluster) {
  if (!config.reuseCluster) {
    await cluster.destroy();
  }
}

async function shouldCreate(config) {
  const exists = await db.find(config);

  return !config.reuseCluster || !exists;
}

function initializeSets(config) {
  let cfg = JSON.parse(JSON.stringify(config));
  if (cfg.sets) {
    return cfg.sets;
  }
  const sets = [];
  for (let counter = cfg.startNodes; counter <= cfg.endNodes; counter++) {
    sets.push(counter);
  }
  return sets;
}
