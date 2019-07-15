const Datastore = require('nedb-promises');

const { Files } = require('./files');

module.exports = {
  save: async (config) => {
    const cfg = JSON.parse(JSON.stringify(config));
    const datastore = Datastore.create(dbPath());

    // do not store sensitive info
    delete cfg.keys;
    delete cfg.nodeKeys;

    return datastore.insert(cfg);
  },

  update: async (config) => {
    const cfg = JSON.parse(JSON.stringify(config));
    const datastore = Datastore.create(dbPath());

    // do not store sensitive info
    delete cfg.keys;

    return datastore.update({ name: cfg.name }, cfg);
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
