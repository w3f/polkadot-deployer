const inquirer = require('inquirer');

module.exports = {
  create: () => {
    const questions = [
      {
        name: 'name',
        type: 'input',
        message: 'Enter the new deployment name:',
        validate: (name) => {
          const existing = ['dep1', 'dep2', 'dep3', 'dep4'];

          if (existing.includes(name)) {
            console.log(`\n${name} deployment already exists, please take another name`);
            return false;
          } else if (!name) {
            return false;
          } else {
            return true;
          }
        }
      },
      {
        name: 'type',
        type: 'list',
        message: 'Deployment type:',
        choices: ['Local', 'Remote']
      },
      {
        name: 'remote_provider',
        type: 'list',
        message: 'Remote provider:',
        when: (answers) => answers.type === 'Remote',
        choices: ['Digital Ocean', 'Azure', 'AWS']
      },
      {
        name: 'type',
        type: 'input',
        message: 'Network name:',
        validate: (name) => !!name,
      },
      {
        name: 'nodes',
        type: 'number',
        message: 'Number of Polkadot nodes:',
        validate: (number) => number > 0,
      }
    ];
    return inquirer.prompt(questions);
  },
  destroy: () => {
    const questions = [
      {
        name: 'name',
        type: 'list',
        message: 'Deployment to destroy:',
        choices: ['dep1', 'dep2', 'dep3', 'dep4']
      }
    ];
    return inquirer.prompt(questions);
  }
};
