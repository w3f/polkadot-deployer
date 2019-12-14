module.exports = {
  default: (subdomain, remoteConfig, index=0) => {
    const base = module.exports.base(remoteConfig, index);

    return `${subdomain}.${base}`;
  },
  telemetry: (deploymentName, remoteConfig, index=0) => {
    const base = module.exports.base(remoteConfig, index);

    return `wss://telemetry-backend.${deploymentName}-0.${base}/submit`;
  },
  base: (remoteConfig, index=0) => {
    return remoteConfig.clusters[index].domain || remoteConfig.domain || "";
  }
}
