const Datastore = require('nedb-promises');

const files = require('./files');

module.exports = {
  save: async (config) => {
    const datastore = Datastore.create(files.deploymentsDBPath());

    // do not store sensitive info
    delete config.keys;

    return datastore.insert(config);
  },

  update: async (config) => {
    const datastore = Datastore.create(files.deploymentsDBPath());

    // do not store sensitive info
    delete config.keys;

    return datastore.update({ name: config.name }, config);
  },

  find: async (config) => {
    const datastore = Datastore.create(files.deploymentsDBPath());

    return datastore.findOne({ name: config.name });
  },

  list: async (projection = {}) => {
    const datastore = Datastore.create(files.deploymentsDBPath());

    return datastore.find({}, projection).sort({ name: 1 });
  },

  remove: async (config) => {
    const datastore = Datastore.create(files.deploymentsDBPath());

    return datastore.remove({ name: config.name });
  }
}
