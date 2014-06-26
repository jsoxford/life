// an example cli player

var net = require('net');
var client = net.connect({port: 3001}, function() {
  console.log('connected');
});


client.on('data', function(data) {
  var message = data.toString();
  
  console.log(">received> " + message)
  
  var data = message.split('')

  // bad solution (flip the numbers)
  var solution = data.map(function(i){return i == '0' ? '1': '0'}).join('')

  console.log("<sending<  " + solution)

  client.write(solution);

});
client.on('end', function() {
  console.log('client disconnected');
});