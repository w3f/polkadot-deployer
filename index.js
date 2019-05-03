#!/usr/bin/env node

const process = require('process');
const program = require('commander');
const version = require('./lib/version');
//const inquirer = require('./lib/inquirer');

program.version(version.show())
  .parse(process.argv);

/*
const run = async () => {
  const answers = await inquirer.main();
  switch (answers.action) {

  }
};

run();
*/
