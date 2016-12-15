const fs = require('fs');
const vm = require('vm');
const mqtt = require('mqtt');
const util = require('util');
const mosca = require('mosca');

const cfg = require('./config.js')

const log = console.log.bind(console, 'LOG');
const error = console.log.bind(console, 'ERROR');
const debug = console.log.bind(console, 'DEBUG');

const scriptPath = 'scripts/';

var server = new mosca.Server(cfg.settings);

server.on('clientConnected', function(client) {
  log('client connected', client.id);
});

// promisify fs.readFile()
var readScript = function (filename) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filename, function(err, buffer) {
      if (err) reject(err);
      else resolve(new vm.Script(buffer));
    });
  });
};

var runScriptInVM = function(script, accountId) {

  var sandbox = {
    mqtt: mqtt
  };

  // copy the account's configuraton to the sandbox
  if (typeof cfg[accountId] !== 'undefined'){
    sandbox = Object.assign(sandbox, cfg[accountId]);
  }

  const context = new vm.createContext(sandbox);
  try {
    script.runInContext(context);
  } catch (err) {
    log('ERROR in script:', err);
  }
}


// fired when a message is received
server.on('published', function(packet, client) {
  debug('Publish', packet.topic);

  if (packet.topic.split('/')[0] === '$SYS') {
    return;
  }

  var accountId = packet.topic.split('/')[1];
  var scriptName = packet.topic.split('/')[2];
  readScript(scriptPath + scriptName + '.js')
  .then(function(res, err) {
    runScriptInVM(res, accountId);
  })
});


// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  var authorized = (username === 'alice' && password.toString() === 'secret');
  if (authorized) client.user = username;
  debug('authenticate:', authorized, client.user, username, password.toString());
  callback(null, authorized);
}

// In this case the client authorized as alice can publish to /alice/... taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
  var check = (client.user == topic.split('/')[1]);
  debug('authorizePublish:', check);
  callback(null, check);
}

// In this case the client authorized as alice can subscribe to /alice/... taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
  var check = (client.user == topic.split('/')[1]);
  debug('authorizeSubscribe:', check);
  callback(null, check);
}

// fired when the mqtt server is ready
function setup() {
  server.authenticate = authenticate;
  server.authorizePublish = authorizePublish;
  server.authorizeSubscribe = authorizeSubscribe;

  console.log("JsIoTPE server is up and running on port", cfg.settings.port);
}

server.on('ready', setup);
