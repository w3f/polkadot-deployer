module.exports = {
  default: (defaultSubdomain, remoteConfig, index=0) => {
    const base = module.exports.base(remoteConfig, index);

    const subdomain = remoteConfig.clusters[index].subdomain || defaultSubdomain

    return `${subdomain}.${base}`;
  },
  telemetrySubmitUrl: (defaultNetworkName, config) => {
    const telemetrySubmitUrl = module.exports._getTelemetrySubmitUrl(defaultNetworkName,config)
    console.log(`telemetry submit url: ${telemetrySubmitUrl}`)
    return telemetrySubmitUrl;
  },
  base: (remoteConfig, index=0) => {
    return remoteConfig.clusters[index].domain || remoteConfig.domain || "";
  },
  _getTelemetrySubmitUrl: (defaultNetworkName,config) => {
    if(!config.monitoring || !config.monitoring.telemetry || !config.monitoring.telemetry.submitUrl){
      return `wss://telemetry-backend.${defaultNetworkName}-0.${module.exports.base(config.remote)}/submit`
    }
    else{
      return config.monitoring.telemetry.submitUrl
    }
  }
}
