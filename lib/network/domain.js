module.exports = {
  default: (subdomain, remoteConfig, index=0) => {
    const base = module.exports.base(remoteConfig, index);

    return `${subdomain}.${base}`;
  },
  telemetry: (deploymentName, dom) => {
    return `wss://telemetry-backend.${deploymentName}-0.${dom}`;
  },
  base: (remoteConfig, index=0) => {
    return remoteConfig.clusters[index].domain || remoteConfig.domain || "";
  }
}
