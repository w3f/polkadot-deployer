#!/usr/bin/env node

const process = require('process');
const program = require('commander');
const version = require('./lib/version');
const init = require('./lib/actions/init');
//const inquirer = require('./lib/inquirer');

program
  .version(version.show());

program
  .command('init')
  .description('initialize the deployer tool')
  .action((cmd) => {
    init.do();
  });

program
  .parse(process.argv);

/*
const run = async () => {
  const answers = await inquirer.main();
  switch (answers.action) {

  }
};

run();
*/
