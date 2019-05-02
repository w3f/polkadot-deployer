const inquirer = require('inquirer');

module.exports = {
  main: () => {
    const questions = [
      {
        name: 'action',
        type: 'list',
        message: 'Main menu:',
        choices: ['Show clusters', 'Create cluster', 'Delete Cluster', 'Exit'],
        default: 'Show clusters'
      },
    ];
    return inquirer.prompt(questions);
  }
};
