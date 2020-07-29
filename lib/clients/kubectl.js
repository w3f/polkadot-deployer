const portastic = require('portastic');

const cmd = require('../core/cmd');
const { Files } = require('../core/files');
const process = require('process');


class Kubectl {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
    const files = new Files(config);

    this.componentsPath = files.componentsPath()

    const kubeconfigPath = files.kubeconfigPath(config.name);

    this.options = {
      env: {
        KUBECONFIG: kubeconfigPath,
        PATH: `${this.componentsPath}:${process.env.PATH}`,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
      },
      cwd: this.componentsPath,
      verbose: config.verbose
    };
  }

  async waitNodesReady(namespace='default') {
    let labels = [];
    for (const n of Array(this.config.nodes).keys()) {
      labels.push(`job-name=polkadot-node-${n}-session-injection`);
    }
    await this.waitPodsReady(labels, namespace, '\\s*Completed\\s*');
    labels = [];
    for (const n of Array(this.config.nodes).keys()) {
      labels.push(`node=polkadot-node-${n}`);
    }
    return this.waitPodsReady(labels, namespace);
  }

  async waitPodsReady(labels, namespace='default', regexp='\\s*1\\/1') {
    const promises = [];
    const options = Object.assign({ matcher: new RegExp(regexp) }, this.options);
    labels.forEach((label) => {
      promises.push(this.cmd(`get pods -l ${label} -n ${namespace} -w`, options));
    });
    return Promise.all(promises);
  }

  async portForward(podName, targetPort, namespace='default') {
    const port = await portastic.find({min: 11000, max: 12000});
    const options = Object.assign({
      detached: true,
      stdio: 'ignore'
    }, this.options);
    const pid = await this.cmd(`port-forward pods/${podName} ${port[0]}:${targetPort} -n ${namespace}`, options);

    return { pid, port: port[0] };
  }

  async deleteVolumeClaims(labels=['app=polkadot', 'app=grafana', 'app=prometheus', 'app=alertmanager']) {
    const promises = [];
    labels.forEach((label) => {
      promises.push(this.cmd(`delete pvc -l ${label} --now`));
    });
    return Promise.all(promises);
  }

  async cmd(command, options = {}) {
    const actualOptions = Object.assign({}, this.options, options);
    return cmd.exec(`./kubectl ${command}`, actualOptions);
  }
}

module.exports = {
  Kubectl
}
