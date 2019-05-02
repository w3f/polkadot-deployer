const inquirer = require('inquirer');

module.exports = {
  main: () => {
    const questions = [
      {
        name: 'action',
        type: 'list',
        message: 'Main menu:',
        choices: [
          'Show clusters',
          new inquirer.Separator(' '),
          'Create cluster',
          new inquirer.Separator(' '),
          'Delete Cluster',
          new inquirer.Separator(' '),
          'Exit'],
        default: 'Show clusters'
      },
    ];
    return inquirer.prompt(questions);
  }
};
