#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const inquirer = require('./lib/inquirer');
const process = require('process');

clear();
console.log(
  chalk.green(
    figlet.textSync('Polkadot Deployer', { horizontalLayout: 'full' })
  )
);

const run = async () => {
  const answers = await inquirer.main();
  console.log(`Selected: ${answers.action}`);
  process.exit(0);
};

run();
