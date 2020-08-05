const fs = require('fs-extra');
const { Files } = require('./files');
const files = new Files();
const process = require('process');

module.exports = {
  read: (path) => {
    module.exports.checkPermissions(path)
    return files.readJSON(path);
  },
  readAndCatch: (path) => {
    try {
      return module.exports.read(path); 
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    } 
  },
  checkPermissions: (path) => {
    const DESIDERED_PERMISSIONS = '600'
    const stat = fs.statSync(path);
    const unixFilePermissions = (stat.mode & parseInt('777', 8)).toString(8);

    if (unixFilePermissions !== DESIDERED_PERMISSIONS) {
      throw new Error(`Expected file permission ${DESIDERED_PERMISSIONS}, found ${unixFilePermissions} for file ${path}`);
    }
  }  
  
}
