const { spawn } = require('child_process');

module.exports = {
  exec: async (command, options={}) => {
    const items = command.split(' ');
    const child = spawn(items[0], items.slice(1), options);

    for await (const data of child.stdout) {
      console.log(data.toString());
    };
  }
}
