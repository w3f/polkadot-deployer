#!/usr/bin/env node

const process = require('process');
const program = require('commander');

const benchmark = require('./lib/actions/benchmark');
const create = require('./lib/actions/create');
const destroy = require('./lib/actions/destroy');
const list = require('./lib/actions/list');
const projectCreate = require('./lib/actions/project/create');
const redeploy = require('./lib/actions/redeploy');
const version = require('./lib/version');


program
  .version(version.show());

program
  .command('list')
  .description('Shows the clusters already deployed.')
  .action(list.do);

program
  .command('create')
  .description('Deploys a new cluster.')
  .option('-c, --config [path]', 'Path to config file.')
  .option('-d, --data [path]', 'Path to data directory.')
  .option('--verbose', 'Output extra info.')
  .action(create.do);

program
  .command('destroy [name]')
  .description('Deletes a deployment.')
  .option('-d, --data [path]', 'Path to data directory.')
  .option('--verbose', 'Output extra info.')
  .action(destroy.do);

program
  .command('redeploy [name]')
  .description('Recreates a deployment on an existing cluster.')
  .option('-d, --data [path]', 'Path to data directory.')
  .option('--verbose', 'Output extra info.')
  .action(redeploy.do);

program
  .command('benchmark')
  .description('Creates deployments and runs benchmarks on them.')
  .option('-c, --config [filePath]', 'path to config file')
  .option('-o, --output [directoryPath]', 'path to output data directory')
  .option('--verbose', 'Output extra info.')
  .action(benchmark.do);


program
  .command('project-create')
  .description('Create a polkadot-deployer projects.')
  .option('-p, --path [path]', 'Path to project directory.', '.')
  .option('--verbose', 'Output extra info')
  .action(projectCreate.do);


program.allowUnknownOption(false);

const parsed = program.parse(process.argv);
if (! parsed || !(parsed.args && parsed.args.length > 0 && (typeof (parsed.args[0] === 'object')))) {
  program.outputHelp();
}
