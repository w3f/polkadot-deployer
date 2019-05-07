const cluster = require('../deployment/cluster');
const files = require('../files');
const helm = require('../deployment/helm');
const init = require('../init');
const inquirer = require('./inquirer');


module.exports = {
  do: async (cmd) => {
    await init.ensure();

    let config;
    if (cmd.config) {
      config = files.readJSON(cmd.config);
    } else {
      config = await inquirer.create();
    }

    return create(config);
  }
}

async function create(config) {
  const deploymentPath = files.deploymentPath(config.name);
  files.createDirectory(deploymentPath);

  try {
    if (config.type === 'local') {
      await cluster.createLocal(config);
    } else {
      await cluster.createRemote(config);
    }
    await helm.install(config);
  } catch (err) {
    rollback(config);
    process.exit(1);
  }
}

function rollback(config) {
  const deploymentPath = files.deploymentPath(config.name);
  fs.deleteDirectory(deploymentPath);
}
