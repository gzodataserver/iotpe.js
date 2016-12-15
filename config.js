// mosca configuration
// -------------------
// Details available [here](https://github.com/mcollina/mosca/wiki/Mosca-advanced-usage)

exports.store = {
  //using ascoltatore
  type: 'mongo',
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'mqttstore',
  mongo: {}
};

exports.settings = {
  port: 1883
  /*, backend: store // remove backend and an in-memory store is used */
};

// setup variables that should be available in the different accounts
// ------------------------------------------------------------------

exports.alice = {
  console: console,
  myvar: 'ZZ'
}
