const path = require('path');
const portastic = require('portastic');

const cmd = require('../cmd');
const files = require('../files');


class Kubectl {
  constructor(config) {
    this.config = config;

    const componentsPath = files.componentsPath()
    this.kubectlPath = path.join(componentsPath, 'kubectl');

    const deploymentPath = files.deploymentPath(config.name);
    const kubeconfigPath = files.kubeconfigPath(config.name);

    this.options = {
      env: {
        KUBECONFIG: kubeconfigPath
      },
      cwd: deploymentPath
    };
  }

  async portForward(podName, labels, targetPort, namespace='default') {
    let options = Object.assign({ matcher: new RegExp(`${podName}\\s*1\\/1\\s*Running`) }, this.options);
    await cmd.exec(
      `${this.kubectlPath} get pods -l ${labels} -n ${namespace} -w`,
      options
    );
    const port = await portastic.find({min: 11000, max: 12000});
    options = Object.assign({
      detached: true,
      stdio: 'ignore'
    }, this.options);
    const pid = await cmd.exec(`${this.kubectlPath} port-forward pods/${podName} ${port[0]}:${targetPort}`, options);

    return { pid, port: port[0] };
  }
}

module.exports = {
  Kubectl
}
