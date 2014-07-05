var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');
var JSONStream = require('JSONStream');
var es = require('event-stream');
var fs = require('fs');

var reference = require('./referenceClient')

app.use(express.static(__dirname + '/public'));

/////
// CLIENT CONNECTING LOGIC

// the connected clients that will increment the game together
var clients = {}; // id: socket
var clientWorlds = {}; // id, world

var clientStats = {
	testsRun: 0,
	testsFailed: 0,
	testsIgnored: 0
};
var client_id = 0,
	problem_id = 0,
  generationId = 0;

var statsFile = 'stats.log';

var width = 20,
	height = 20;

// todo - use buffer
var world = new Array();

for (var x = 0; x < width; x++) {
  for (var y = 0; y < height; y++) {
    if(Math.random() > .5){
      world.push({x: x, y:y});
    }
  }
}

// read and write parts of the world
// world, w, h are set
// function writeSquare(data, x, y, w, h){
//   for(var i = 0; i < w; i++){
//     for(var j = 0; j < h; j++){
//       world[ i+x + ((j+y)*width)] = !! data[i + (j*w)];
//     }
//   }
// }

function readSquare(x, y, w, h) {
	var data = new Array(w * h);
	for (var i = 0; i < w; i++) {
		for (var j = 0; j < h; j++) {
			data[i + (j * w)] = world[i + x + ((j + y) * width)];
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
  clientWorlds[id] = world.slice(0);

	console.log('client ' + id + ' connected');

	c.on('end', function() {
		delete clients[id];
    delete clientWorlds[id];
		console.log('client ' + id + ' disconnected');
	});

	c.pipe(JSONStream.parse(true))
		.pipe(es.mapSync(function (data) {
      process(id, data)
		}))

});

server.listen(8787, function() {
	console.log('listening for clients on *:8787');
});


// process a message from the client

function process(clientId, data) {
	try {
		if (data.success === false) {
			// We'll not worry and just ignore it for now
		}
    else if(data.respondingTo === 'tickBoard'){
      var latestResult = data.payload[0].generation > data.payload[1].generation ? 0 : 1;
      var generationId = data.payload[latestResult].generation;

      var tickResult = data.payload[latestResult].result;
      var lastTick = clientWorlds[clientId].slice(0);
      var nextTick = reference.tickBoard(lastTick);

      // validate against reference
      //FIXME do some validation

      // update reference
      clientWorlds[clientId] = nextTick;
    }
    else if(data.respondingTo === 'tickCell'){
      var latestResult = data.payload[0].generation > data.payload[1].generation ? 0 : 1;
      var generationId = data.payload[latestResult].generation;

      var tickResult = data.payload[latestResult].result;
			var lastTick = clientWorlds[clientId].slice(0);
			var nextTick = reference.tickCell(lastTick);
      console.dir(clientId + ':' + generationId + " => "+ tickResult);

      // FIXME update the board with the next cell

    }
    else if (data.respondingTo === 'processIteration') {
			var iterationId = data.payload[1].generation;
			var iterationResult = data.payload[1].result;

			var p = data.payload[1].result || {};

			io.emit('state', {
				world: world,
				clientStats: clientStats
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
    else if (data.action === 'consumeTestResults') {
			clientStats.testsRun += data.payload.testsRun;
			clientStats.testsFailed += data.payload.testsFailed;
			clientStats.testsIgnored += data.payload.testsIgnored;

			io.emit('state', {
				world: world,
				clientStats: clientStats
			});

			// Dump the stats to a file for later
			var logMsg = new Date().getTime() + ': ' + JSON.stringify(data.payload) + '\n';
			fs.exists(statsFile, function(exists) {
				if (!exists) {
					fs.writeFile(statsFile, '');
				}
				fs.appendFile(statsFile, logMsg, function(err) {
					if (err) {
						console.error("Writing to the stats log file failed. This isn't catastrophic, but stats are nice.");
					}
				});
			});
		} else {
			console.log('Unknown message received:');
			console.log(data);
		}
	} catch (e) {
		// Something went wrong, it was probably the input from the client. Crack on!
		console.log('Unknown message received:');
		console.log(data);
    console.error(e);
	}
}

function tickEverything(generationId){
  var activeClients = Object.keys(clients).filter(function (clientId) { return clientId != null; })

  // Send out tick request for each client's board
  activeClients.forEach(function (clientId) {
    sendCommand(clientId, 'tickBoard', {
      generation: generationId,
      result: clientWorlds[clientId]
    });
  });

  // Send out tick request for each cell
  // FIXME

}

function sendCommand(clientId, action, payload){
  var request = {
      action: action,
      payload: payload
    }
  clients[clientId].write(JSON.stringify(request) + '\n');
}

io.on('connection', function(socket) {
	socket.emit('state', {
		world: world,
		clientStats: clientStats
	});

	socket.on('on', function(data) {
		var x = data[0],
			y = data[1];
		var i = x + (y * width);
		if (world[i] !== undefined) {
			world[i] = false;
		}
	});

});


// Repeatedly ask for the next generation
setInterval(function () {
  tickEverything(generationId);
  generationId++;
}, 1000)


http.listen(3000, function() {
	console.log('listening on *:3000');
});
