const chalk = require('chalk');
const Table = require('cli-table3');

const init = require('../init');

module.exports = {
  do: async () => {
    await init.ensure();

    let table = new Table({
      head: [chalk.green('Network name'),
             chalk.green('Deployment type'),
             chalk.green('Provider'),
             chalk.green('Workers'),
             chalk.green('Polkadot nodes')
            ]
    });

    table.push(
      ['testnet1', 'local', 'kind', '2', '4'],
      ['testnet2', 'remote', 'Digital Ocean', '8', '24'],
      ['alexander', 'remote', 'Digital Ocean', '4', '12'],
      ['testnet3', 'remote', 'Azure', '16', '32'],
    );
    console.log(table.toString());
  }
}
