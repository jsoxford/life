var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');

app.use(express.static(__dirname + '/public'));

// todo - use buffer
var world = new Array(100*100);

setInterval(function(){
  for (var i = world.length - 1; i >= 0; i--) {
    world[i] = Math.random() > .5;
  }

  io.emit('state', {
    world:world
  });
}, 1000)



http.listen(3000, function(){
  console.log('listening on *:3000');
});


var server = net.createServer(function(c) {
  console.log('client connected');

  c.on('end', function() {
    console.log('client disconnected');
  });

  // would be more sane, but this is just a hack for now
  var problem = '000110000';
  c.write(problem);

  console.log(">>  problem - " + problem);

  c.on('data', function(data){
    console.log("<< solution - " + data.toString());
  })

});


server.listen(3001, function() {
  console.log('player listener on *:3001');
});