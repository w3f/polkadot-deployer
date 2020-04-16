//const fs = require('fs-extra');

const { Files } = require('./files');

const files = new Files();

module.exports = {
  read: (cfgPath) => {
    // check ownership and permissions of the config file
    //const stat = fs.statSync(cfgPath);
    return files.readJSON(cfgPath);
  }
}
