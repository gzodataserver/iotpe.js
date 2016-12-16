myvar += ",kitty";

var result = {
  myvar: myvar
};

console.log('result:', result);

var client  = mqtt.connect('mqtt://localhost', {username: 'jsiotpe', password: 'jsiotpe'});

client.on('connect', function () {
  client.publish('/jsiotpe/calc/result', JSON.stringify(result));
  client.end();
})


//console.log('myvar2:', myvar2);
