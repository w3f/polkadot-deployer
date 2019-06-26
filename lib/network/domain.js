module.exports = {
  default: (subdomain, domain) => {
    return `${subdomain}.${domain}`;
  },
  telemetry: (deploymentName, dom) => {
    return `wss://telemetry-backend.${deploymentName}-0.${dom}`;
  }
}
