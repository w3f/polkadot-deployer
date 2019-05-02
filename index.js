#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const ProgressBar = require('progress');
const https = require('https');

clear();
console.log(
  chalk.green(
    figlet.textSync('Polkadot Deployer', { horizontalLayout: 'full' })
  )
);

console.log(chalk.yellow('Downloading components...'));

let req = https.request({
  host: 'download.github.com',
  port: 443,
  path: '/visionmedia-node-jscoverage-0d4608a.zip'
});

req.on('response', (res) => {
  let len = parseInt(res.headers['content-length'], 10);

  console.log();
  let bar = new ProgressBar('  downloading component1 [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: len
  });

  res.on('data', (chunk) => {
    bar.tick(chunk.length);
  });

  res.on('end', () => {
    console.log('\n');

    console.log(chalk.green('Components downloaded'));
  });
});

req.end();
