const inquirer = require('inquirer');

module.exports = {
  main: () => {
    const questions = [
      {
        name: 'action',
        type: 'list',
        message: 'Create cluster of type:',
        choices: [
          'Local',
          new inquirer.Separator(' '),
          'Remote',
        ],
        default: 'Local'
      },
    ];
    return inquirer.prompt(questions);
  },
};
