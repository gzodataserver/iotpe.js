// mosca configuration
// -------------------
// Details available [here](https://github.com/mcollina/mosca/wiki/Mosca-advanced-usage)

var store = {
  //using ascoltatore
  type: 'mongo',
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'mqttstore',
  mongo: {}
};

var settings = {
  port: 1883
  /*, backend: store // remove backend and an in-memory store is used */
};
