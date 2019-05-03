#!/usr/bin/env node

const inquirer = require('./lib/inquirer');
const process = require('process');
const program = require('commander');
const version = require('./lib/version');

program.version(version.show())
  .parse(process.argv);

const run = async () => {
  const answers = await inquirer.main();
  switch (answers.action) {

  }
};

//run();
