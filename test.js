var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://localhost', {username: 'jsiotpe', password: 'jsiotpe'});

client.on('connect', function () {
  client.subscribe('/jsiotpe/calc/result')
  client.publish('/jsiotpe/calc', 'Hello mqtt')
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
  client.end()
})
