const Datastore = require('nedb-promises');

const { Files } = require('./files');

module.exports = {
  save: async (config) => {
    const datastore = Datastore.create(dbPath());

    // do not store sensitive info
    delete config.keys;
    delete config.nodeKeys;

    return datastore.insert(config);
  },

  update: async (config) => {
    const datastore = Datastore.create(dbPath());

    // do not store sensitive info
    delete config.keys;

    return datastore.update({ name: config.name }, config);
  },

  find: async (config) => {
    const datastore = Datastore.create(dbPath());

    return datastore.findOne({ name: config.name });
  },

  list: async (projection = {}) => {
    const datastore = Datastore.create(dbPath());

    return datastore.find({}, projection).sort({ name: 1 });
  },

  remove: async (config) => {
    const datastore = Datastore.create(dbPath());

    return datastore.remove({ name: config.name });
  }
}

function dbPath() {
  const files = new Files();
  return files.deploymentsDBPath();
}
