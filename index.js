var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');
var JSONStream = require('JSONStream');
var es = require('event-stream');


app.use(express.static(__dirname + '/public'));

/////
// CLIENT CONNECTING LOGIC

// the connected clients that will increment the game together
var clients = {}; // id: socket

var client_id = 0, problem_id = 0;

var width = 20,
    height = 20;

// todo - use buffer
var world = new Array(width*height);

for (var i = world.length - 1; i >= 0; i--) {
  world[i] = Math.random() > .5;
}
// console.log(world.length)


// read and write parts of the world
// world, w, h are set
function writeSquare(data, x, y, w, h){
  for(var i = 0; i < w; i++){
    for(var j = 0; j < h; j++){
      world[ i+x + ((j+y)*width)] = !! data[i + (j*w)];
    }
  }
}

function readSquare(x, y, w, h){
  var data = new Array(w*h);
  for(var i = 0; i < w; i++){
    for(var j = 0; j < h; j++){
      data[i + (j*w)] = world[i+x + ((j+y)*width)];
    }
  }
  return data;
}



// this maps responses to where the world should be updated
var populator = {
  /* g0:{x:0, y:0, width:5, height:5 } */
}



var server = net.createServer(function(c) {
  var id = client_id++;
  clients[id] = c;

  console.log('client ' + id + ' connected');

  c.on('end', function() {
    delete clients[id];
    console.log('client ' + id + ' disconnected');
  });

  c.pipe(JSONStream.parse(true))
  .pipe(es.mapSync(process))

});

server.listen(3001, function() {
  console.log('listening for clients on *:3001');
});


// process a message from the client
function process(data){

  if(data.respondingTo === 'processIteration'){
    var p = data.payload || {};
    Object.keys(p).forEach(function(k){

      var populate = populator[k];
      var solution = p[k].split('').map(function(d){return d === '1'});

      if(populate){
        writeSquare(solution, populate.x, populate.y, populate.width, populate.height)
      }

      // clean up
      delete populator[k]


      io.emit('state', {
        world:world
      });

    })
  }
}

function dispatch(client, x, y, w, h){

  if(!clients.hasOwnProperty(client)) return;

  var id = 'g' + problem_id++;
  populator[id] = {
    x:x,
    y:y,
    width:w,
    height:h
  };

  setTimeout(function(){
    delete populator[id]
  }, 5000)

  var request = {
    action: "processIteration",
    payload: {}
  }

  var problem = readSquare(x, y, w, h)

  request.payload[id] = problem.map(function(x){return x ? '1':'0'}).join('');

  clients[client].write(JSON.stringify(request) + '\n');
}


io.on('connection', function (socket) {
  socket.emit('state', {
    world:world
  });
});


setInterval(function(){

  // ask a player for a solution to part of the world
  var player = Object.keys(clients)[0];
  if(player){
    dispatch(player, 0, 0, 10, 10);
  }

}, 1000)


http.listen(3000, function(){
  console.log('listening on *:3000');
});
