const waitOn = require('wait-on');

const cmd = require('../../../core/cmd');
const download = require('../../../core/download');
const files = require('../../../core/files');


class LocalCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
  }

  async create() {
    try {
      await cmd.exec(`docker run -d --privileged --name ${this.config.name} -p 8443:8443 -p 10080:10080 bsycorp/kind:latest-1.13`, {verbose: this.config.verbose});
    } catch (err) {
      console.error(`Could not create local deployment: ${err.message}`);
      throw err;
    }

    try {
      await waitOn({
        resources: ['http://127.0.0.1:10080/kubernetes-ready'],
        log: this.config.verbose
      });
    } catch (err) {
      console.error(`Could not get k8s ready file: ${err.message}`);
      await rollback(this.config);
      throw err;
    }

    const kubeconfigPath = files.kubeconfigPath(this.config.name);

    try {
      await download.file('http://127.0.0.1:10080/config', kubeconfigPath);
    } catch (err) {
      console.error(`Could not download k8s config: ${err.message}`);
      await rollback(this.config);
      throw err;
    }
  }

  async destroy() {
    try {
      await cmd.exec(`docker rm -f ${this.config.name}`, {verbose: this.config.verbose});
    } catch (err) {
      console.error(`Could not delete local deployment: ${err.message}`);
    }
  }
}

module.exports = {
  LocalCluster
}

async function rollback(config) {
  await cmd.exec(`docker rm -f ${config.name}`, {verbose: config.verbose});
}
