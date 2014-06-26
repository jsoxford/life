var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');

app.use(express.static(__dirname + '/public'));

// only one player for now
var player;


// todo - use buffer
var world = new Array(10*10);

for (var i = world.length - 1; i >= 0; i--) {
  world[i] = Math.random() > .5;
}

io.on('connection', function (socket) {
  socket.emit('state', {
    world:world
  });
});


setInterval(function(){

  // ask the player for a solution
  if(player){

    // would be more sane, but this is just a hack for now
    var problem = world.map(function(p){
      return p ? '1' : '0';
    }).join('');

    // c.write(problem);

    console.log(">>  problem - " + problem);

    player.write(problem)
  }

}, 1000)



http.listen(3000, function(){
  console.log('listening on *:3000');
});


var server = net.createServer(function(c) {
  player = c;

  console.log('client connected');

  c.on('end', function() {
    player = null;
    console.log('client disconnected');
  });


  c.on('data', function(data){
    console.log("<< solution - " + data.toString());

    data.toString()
      .split('')
      .forEach(function(value, index){
        world[index] = value == '1';
      });

    io.emit('state', {
      world:world
    });
  })

});


server.listen(3001, function() {
  console.log('player listener on *:3001');
});