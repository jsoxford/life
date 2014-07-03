var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');
var JSONStream = require('JSONStream');
var es = require('event-stream');
var fs = require('fs');


app.use(express.static(__dirname + '/public'));

/////
// CLIENT CONNECTING LOGIC

// the connected clients that will increment the game together
var clients = {}; // id: socket
var clientStats = {
    testsRun: 0,
    testsFailed: 0,
    testsIgnored: 0
};
var client_id = 0, problem_id = 0;

var statsFile = 'stats.log';

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

server.listen(8787, function() {
  console.log('listening for clients on *:8787');
});


// process a message from the client
function process(data){
  if(data.respondingTo === 'processIteration'){
      var iterationId = data.payload[1].generation;
      var iterationResult = data.payload[1].result;

    var p = data.payload[1].result || {};

    io.emit('state', {
      world:world,
      clientStats:clientStats
    });

    // Object.keys(p).forEach(function(k){
    //
    //   var populate = populator[k];
    //   var solution = p[k].split('').map(function(d){return d === '1'});
    //
    //   if(populate){
    //     writeSquare(solution, populate.x, populate.y, populate.width, populate.height)
    //   }
    //
    //   // clean up
    //   delete populator[k]
    // })
  }
  else if(data.action === 'consumeTestResults'){
    clientStats.testsRun += data.payload.testsRun;
    clientStats.testsFailed += data.payload.testsFailed;
    clientStats.testsIgnored += data.payload.testsIgnored;

    io.emit('state', {
      world:world,
      clientStats:clientStats
    });

    // Dump the stats to a file for later
    var logMsg = new Date().getTime() + ': ' + JSON.stringify(data.payload) + '\n';
    fs.exists(statsFile, function(exists) {
    if (!exists) {
        fs.writeFile(statsFile, '');
    }
    fs.appendFile(statsFile, logMsg, function (err) {
        if(err){
            console.error("Writing to the stats log file failed. This isn't catastrophic, but stats are nice.");
        }
    });
});

  }
  else{
    console.log('Unknown message received:');
    console.log(data);
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
    payload: {
        generation: problem_id,
        result: readSquare(x, y, w, h).map(function(x){return x ? '1':'0'}).join('')
    }
  }
  clients[client].write(JSON.stringify(request) + '\n');
}


io.on('connection', function (socket) {
  socket.emit('state', {
    world:world,
    clientStats: clientStats
  });

  socket.on('on', function (data) {
    var x = data[0], y = data[1];
    var i = x + (y*width);
    if(world[i] !== undefined){
      world[i] = false;
    }
  });

});


// Repeatedly ask for the next generation
setInterval(function(){
  // ask a player for a solution to part of the world
  var player = Object.keys(clients)[0];
  if(player != null){
    dispatch(player, 0, 0, 10, 10);
  }
}, 1000)


http.listen(3000, function(){
  console.log('listening on *:3000');
});
