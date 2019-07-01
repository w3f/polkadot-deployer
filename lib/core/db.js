const Datastore = require('nedb-promises');

const { Files } = require('./files');

const files = new Files();
const deploymentsDBPath = files.deploymentsDBPath();

module.exports = {
  save: async (config) => {
    const datastore = Datastore.create(deploymentsDBPath);

    // do not store sensitive info
    delete config.keys;
    delete config.nodeKeys;

    return datastore.insert(config);
  },

  update: async (config) => {
    const datastore = Datastore.create(deploymentsDBPath);

    // do not store sensitive info
    delete config.keys;

    return datastore.update({ name: config.name }, config);
  },

  find: async (config) => {
    const datastore = Datastore.create(deploymentsDBPath);

    return datastore.findOne({ name: config.name });
  },

  list: async (projection = {}) => {
    const datastore = Datastore.create(deploymentsDBPath);

    return datastore.find({}, projection).sort({ name: 1 });
  },

  remove: async (config) => {
    const datastore = Datastore.create(deploymentsDBPath);

    return datastore.remove({ name: config.name });
  }
}
