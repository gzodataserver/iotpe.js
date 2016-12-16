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


// MySQL configuration
// -------------------

exports.db_config = {
  host : 'localhost'
};


//  Variables that should be available for the different accounts
// -------------------------------------------------------------

const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

exports.all = {
  mqtt: mqtt,
  nodemailer: nodemailer,
  console: console
};

exports.jsiotpe = {
  myvar: 'ZZ'
}


//  MySQL test credentials
// ---------------------

exports.mqttTestSettings = {
  url: 'mqtt://localhost',
  username: 'jsiotpe',
  password: 'jsiotpe'
}
