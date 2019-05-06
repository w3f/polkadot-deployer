#!/usr/bin/env node

const process = require('process');
const program = require('commander');
const version = require('./lib/version');
const list = require('./lib/actions/list');
const create = require('./lib/actions/create');
const destroy = require('./lib/actions/destroy');

program
  .version(version.show());

program
  .command('list')
  .description('show the clusters already deployed')
  .action(list.do);

program
  .command('create')
  .description('deploys a new cluster')
  .action(create.do);

program
  .command('destroy')
  .description('deletes a deployed cluster')
  .action(destroy.do);


program.allowUnknownOption(false);

const parsed = program.parse(process.argv);
if (!(parsed.args && parsed.args.length > 0 && (typeof (parsed.args[0] === 'object')))) {
  program.outputHelp();
}
