const waitOn = require('wait-on');

const cmd = require('../local/cmd');
const download = require('../local/download');
const files = require('../local/files');


module.exports = {
  create: async (config) => {
    if (config.type === 'local') {
      return module.exports.createLocal(config);
    } else {
      return module.exports.createRemote(config);
    }
  },


  createLocal: async (config) => {
    try {
      await cmd.exec(`docker run -d --privileged --name ${config.name} -p 8443:8443 -p 10080:10080 bsycorp/kind:latest-1.13`);
    } catch (err) {
      console.error(`Could not create local deployment: ${err.message}`);
      throw err;
    }

    try {
      await waitOn({
        resources: ['http://127.0.0.1:10080/kubernetes-ready'],
        log: true
      });
    } catch (err) {
      console.error(`Could not get k8s ready file: ${err.message}`);
      await rollback(config);
      throw err;
    }

    const kubeconfigPath = files.kubeconfigPath(config.name);

    try {
      await download.file('http://127.0.0.1:10080/config', kubeconfigPath);
    } catch (err) {
      console.error(`Could not download k8s config: ${err.message}`);
      await rollback(config);
      throw err;
    }
  },

  createRemote: async () => {
  },

  destroy: async (config) => {
    if (config.type === 'local') {
      return module.exports.destroyLocal(config);
    } else {
      return module.exports.destroyRemote(config);
    }
  },

  destroyLocal: async (config) => {
    try {
      await cmd.exec(`docker rm -f ${config.name}`);
    } catch (err) {
      console.error(`Could not delete local deployment: ${err.message}`);
    }
  },

  destroyRemote: async () => {
  }
}

async function rollback(config) {
  await cmd.exec(`docker rm -f ${config.name}`);
}
