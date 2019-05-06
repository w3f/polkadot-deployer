const chalk = require('chalk');
const Table = require('cli-table3');

const init = require('../init');

module.exports = {
  do: () => {
    init.ensure();

    let table = new Table({
      head: [chalk.green('Name'),
             chalk.green('Deployment type'),
             chalk.green('Network name'),
             chalk.green('Provider'),
             chalk.green('Workers'),
             chalk.green('Polkadot nodes')
            ]
    });

    table.push(
      ['dep1', 'local', 'testnet1', 'kind', '2', '4'],
      ['dep2', 'remote', 'testnet2', 'Digital Ocean', '8', '24'],
      ['dep3', 'remote', 'alexander', 'Digital Ocean', '4', '12'],
      ['dep4', 'remote', 'testnet4', 'Azure', '16', '32'],
    );
    console.log(table.toString());
  }
}
