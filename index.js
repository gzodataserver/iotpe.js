const vm = require('vm');
const util = require('util');
const mosca = require('mosca');

const config = require('config')

var server = new mosca.Server(config.settings);

server.on('clientConnected', function(client) {
    console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  if (packet.topic.indexOf('result') === 0) {
    return;
  }

  if (packet.topic.indexOf('calc') === 0) {

    const sandbox = {
      animal: 'cat',
      count: 2,
      console: console,
      server: server
    };

    const privateVar = 'This should not be accessable';

    const script = new vm.Script('count += 1; name = "kitty"; console.log("should be undefined:" + typeof privateVar); server.publish({topic: "result", payload: name});');

    const context = new vm.createContext(sandbox);
    for (var i = 0; i < 10; ++i) {
      script.runInContext(context);
    }

    // console.log(util.inspect(sandbox));
    // { animal: 'cat', count: 12, name: 'kitty' }
  }


  console.log('Received', packet.payload.toString());
});


// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  var authorized = (username === 'alice' && password.toString() === 'secret');
  if (authorized) client.user = username;
  callback(null, authorized);
}

// In this case the client authorized as alice can publish to /alice/... taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
  callback(null, client.user == topic.split('/')[0]);
}

// In this case the client authorized as alice can subscribe to /alice/... taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
  callback(null, client.user == topic.split('/')[0]);
}

// fired when the mqtt server is ready
function setup() {
  server.authenticate = authenticate;
  server.authorizePublish = authorizePublish;
  server.authorizeSubscribe = authorizeSubscribe;

  console.log("JsIoTPE server is up and running on $(config.settings.port)");
}

server.on('ready', setup);
