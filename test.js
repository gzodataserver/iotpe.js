var mqtt = require('mqtt');
var cfg = require('./config.js');

var client  = mqtt.connect(cfg.mqttTestSettings.url, cfg.mqttTestSettings);

client.on('connect', function () {
  client.subscribe(`/${cfg.mqttTestSettings.username}/calc/result`)
  client.publish(`/${cfg.mqttTestSettings.username}/run/calc`, 'Hello mqtt')
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
  client.end()
})
