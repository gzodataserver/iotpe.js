// Imports
// =======

const fs = require('fs');
const vm = require('vm');
const mqtt = require('mqtt');
const util = require('util');
const mosca = require('mosca');
const mysql = require('mysql');

const cfg = require('./config.js')

// Logging
// ========

const log = console.log.bind(console, new Date(), 'LOG');
const error = console.log.bind(console, new Date(), 'ERROR');
const debug = console.log.bind(console, new Date(), 'DEBUG');


// Constants
// =========

const scriptPath = 'scripts/';

// Variables
// =========

// store account passwords
var accountPasswords = {};


// Helpers
// ========

var createMysqlConn = function (accountId, password) {
  return mysql.createConnection({
    host     : cfg.db_config.host,
    user     : accountId,
    password : password || accountPasswords[accountId],
    database : accountId
  });
};

var checkCredentials = function(accountId, password) {
  return new Promise(function (resolve, reject) {
    var conn = createMysqlConn(accountId, password);
    var t = conn.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
      var res = err === null;
      conn.end();
    	resolve(res);
    });
  });
};

// promisify fs.readFile()
var readScript = function (filename) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filename, function(err, buffer) {
      if (err) reject(err);
      else resolve(new vm.Script(buffer));
    });
  });
};

var runScriptInVM = function(script, accountId, password) {
  debug('runScriptInVM', accountId);

  var connection = createMysqlConn();
  var sandbox = {
    mqtt: mqtt,
    connection: connection
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
};

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  checkCredentials(username, password.toString()).then(function(authorized){
    debug('authenticate:', authorized, ', user: ', username);
    if (authorized) {
      client.user = username;
      accountPasswords[username] = password.toString();
    }
    callback(null, authorized);
  })
};

// In this case the client authorized as alice can publish to /accountId/... taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
  var check = (client.user == topic.split('/')[1]);
  debug('authorizePublish:', check, ', topic:', topic, ', user:', client.user);
  callback(null, check);
};

// In this case the client authorized as alice can subscribe to /accountId/... taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
  var check = (client.user == topic.split('/')[1]);
  debug('authorizeSubscribe:', check, ', topic:', topic, ', user:', client.user);
  callback(null, check);
};

// fired when the mqtt server is ready
var setup = function () {
  server.authenticate = authenticate;
  server.authorizePublish = authorizePublish;
  server.authorizeSubscribe = authorizeSubscribe;

  console.log("JsIoTPE server is up and running on port", cfg.settings.port);
}

// Handle errors
// =============

process.on('uncaughtException', function(err){
  log(err);
  process.exit(0);
});

// Main
// =====

var server = new mosca.Server(cfg.settings);

server.on('clientConnected', function(client) {
  log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  debug('Publish', packet.topic);

  if (packet.topic.split('/')[0] === '$SYS') {
    return;
  }

  var empty, accountId, operator, scriptName;
  [empty, accountId, operator, scriptName, ...rest] = packet.topic.split('/');

  if (operator === 'run') {
    readScript(scriptPath + accountId + '_' + scriptName + '.js')
    .then(function(res, err) {
      runScriptInVM(res, accountId);
    });
  }
});

server.on('ready', setup);
