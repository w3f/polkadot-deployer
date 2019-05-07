const { spawn } = require('child_process');


module.exports = {
  exec: async (command, options={}) => {
    return new Promise((resolve, reject) => {
      const items = command.split(' ');
      const child = spawn(items[0], items.slice(1), options);

      child.stdout.on('data', (data) => {
        console.log(data.toString());
      });

      child.stderr.on('data', (data) => {
        console.log(data.toString());
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.error(`Command execution failed with code: ${code}`);
          reject();
        }
        else {
          resolve();
        }
      });
    });
  }
}
