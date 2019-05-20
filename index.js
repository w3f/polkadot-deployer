#!/usr/bin/env node

const process = require('process');
const program = require('commander');

const version = require('./lib/version');
const list = require('./lib/actions/list');
const create = require('./lib/actions/create');
const destroy = require('./lib/actions/destroy');
const redeploy = require('./lib/actions/redeploy');
const benchmark = require('./lib/actions/benchmark');


program
  .version(version.show());

program
  .command('list')
  .description('Shows the clusters already deployed.')
  .action(list.do);

program
  .command('create')
  .description('Deploys a new cluster.')
  .option('-c, --config [path]', 'path to config file')
  .option('--verbose', 'Output extra info.')
  .action(create.do);

program
  .command('destroy [name]')
  .description('Deletes a deployment.')
  .option('--verbose', 'Output extra info.')
  .action(destroy.do);

program
  .command('redeploy [name]')
  .description('Recreates a deployment on an existing cluster.')
  .option('--verbose', 'Output extra info.')
  .action(redeploy.do);

program
  .command('benchmark')
  .description('Creates deployments and runs benchmarks on them.')
  .option('-c, --config [filePath]', 'path to config file')
  .option('-o, --output [directoryPath]', 'path to output data directory')
  .option('--verbose', 'Output extra info.')
  .action(benchmark.do);


program.allowUnknownOption(false);


const parsed = program.parse(process.argv);
if (!(parsed.args && parsed.args.length > 0 && (typeof (parsed.args[0] === 'object')))) {
  console.log(parsed.args.length);
  program.outputHelp();
}
