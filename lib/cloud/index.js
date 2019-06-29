const process = require('process');

module.exports = {
  credentials: () => {
    return {
      gcp: process.env.GOOGLE_APPLICATION_CREDENTIALS
    }
  }
}
