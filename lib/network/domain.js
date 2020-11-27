module.exports = {
  default: (defaultSubdomain, remoteConfig, index=0) => {
    const base = module.exports.base(remoteConfig, index);

    const subdomain = remoteConfig.clusters[index].subdomain || defaultSubdomain

    return `${subdomain}.${base}`;
  },
  telemetry: (defaultNetworkName, config, index=0) => {
    const remoteConfig = config.remote
    const base = module.exports.base(remoteConfig, index);

    const telemetryNetworkSubdomain = module.exports._getTelemetryNetworkSubdomain(defaultNetworkName,config);
    console.log(`telemetry: wss://telemetry-backend.${telemetryNetworkSubdomain}.${base}/submit`)

    return `wss://telemetry-backend.${telemetryNetworkSubdomain}.${base}/submit`;
  },
  base: (remoteConfig, index=0) => {
    return remoteConfig.clusters[index].domain || remoteConfig.domain || "";
  },
  _getTelemetryNetworkSubdomain: (defaultNetworkName, config) => {
    if(!config.monitoring || !config.monitoring.telemetry || !config.monitoring.telemetry.submit)
      return `${defaultNetworkName}-0`

    return config.monitoring.telemetry.submit.networkSubdomain
  }
}
