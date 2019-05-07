const { spawn } = require('child_process');


module.exports = {
  exec: async (command, options={}) => {
    return new Promise((resolve, reject) => {
      const items = command.split(' ');
      const child = spawn(items[0], items.slice(1), options);
      let match = false;

      child.stdout.on('data', (data) => {
        if (options.matcher && options.matcher.test(data)) {
          match = true;
          child.kill('SIGTERM');
          resolve();
          return;
        }
        console.log(data.toString());
      });

      child.stderr.on('data', (data) => {
        console.log(data.toString());
      });

      child.on('close', (code) => {
        if (code !== 0 && !match) {
          console.error(`Command execution failed with code: ${code}`);
          reject(new Error(code));
        }
        else {
          resolve();
        }
      });
    });
  }
}
