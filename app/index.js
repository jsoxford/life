var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

// todo - use buffer
var world = new Array(100*100);

setInterval(function(){
  for (var i = world.length - 1; i >= 0; i--) {
    world[i] = Math.random() > .5;
  }

  io.emit('state', {world:world});
}, 1000)



http.listen(3000, function(){
  console.log('listening on *:3000');
});