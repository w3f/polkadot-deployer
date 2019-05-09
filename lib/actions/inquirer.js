const inquirer = require('inquirer');

const db = require('../db');

module.exports = {
  create: async () => {
    const questions = [
      {
        name: 'name',
        type: 'input',
        message: 'Enter the new deployment name:',
        validate: async (name) => {
          const existing = await existingDeployments();

          if (existing.includes(name)) {
            console.log(`\n${name} deployment already exists, please pick another name`);
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
        choices: ['local']
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
  select: async () => {
    const existing = await existingDeployments();
    const questions = [
      {
        name: 'name',
        type: 'list',
        message: 'Select a deployment:',
        choices: existing
      }
    ];
    return inquirer.prompt(questions);
  }
};

async function existingDeployments() {
  const deployments = await db.list();

  let output = [];
  deployments.forEach((deployment) => {
    output.push(deployment.name);
  })
  return output;
}
