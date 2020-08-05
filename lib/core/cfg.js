const fs = require('fs-extra');

const { Files } = require('./files');

const files = new Files();

module.exports = {
  read: (cfgPath) => {
    // check permissions of the config file
    const stat = fs.statSync(cfgPath);
    const unixFilePermissions = (stat.mode & parseInt('777', 8)).toString(8);

    if (unixFilePermissions !== '600') {
      throw new Error(`Expected file permission 0600, found ${unixFilePermissions} for file ${cfgPath}`);
    }

    return files.readJSON(cfgPath);
  },
  readSafeConfigFileFromCommand: (command) => {
        try {
            this.read(command.config); 
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        } 
    }
  
}
