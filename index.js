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
var world = [];

var tempWorld = new Array(width * height);
for (var x = 0; x < width; x++) {
  for (var y = 0; y < height; y++) {
    tempWorld[ x + (y*width)] = Math.random() > .5;
  }
}
writeSquareFromArray(tempWorld, 0, 0, width, height);

function getKeyFromXY(x, y){
	return x + ':' + y
}
function getXYFromKey(key){
	var coords = key.split(':');
	return {
		x: coords[0],
		y: coords[1]
	};
}

// read and write parts of the world
// world, w, h are set
function writeSquareFromArray(data, x, y, w, h){
  for(var i = 0; i < w; i++){
    for(var j = 0; j < h; j++){
      if(!! data[i + (j*w)]){
				world[getKeyFromXY(x+i, y+j)] = true;
			}
    }
  }
}

function readSquareToArray(x, y, w, h) {
	var data = new Array(w * h);
	for (var i = 0; i < w; i++) {
		for (var j = 0; j < h; j++) {
			data[i + (j * w)] = !!world[getKeyFromXY(x+i, y+j)];
		}
	}
	return data;
}

function toIndexOfKey(cell) {
	return cell.x + ":" + cell.y
	}

function toBinaryString(arrayOfBooleans){
	return arrayOfBooleans.map(function (value) {
		return value ? 1 : 0;
	}).join('');
}


var server = net.createServer(function(c) {
	var id = client_id++;
	clients[id] = c;
  clientWorlds[id] = readSquareToArray(0,0, width, height)

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
				world: readSquareToArray(0,0, width, height),
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
				world: readSquareToArray(0,0, width, height),
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
	// First close off the previous generation (time out anything we haven't received yet)
	var nextTick = [];
	// FIXME replace with tickBoard from referenceClient
	Object.keys(world).forEach(function (liveCell, index, array) {
		var cell = getXYFromKey(liveCell);
		// calculate for every neighbour too
		for (var x = -1; x <= 1; x++) {
			for (var y = -1; y <= 1; y++) {
				var cellX = cell.x-1 + x;
				var cellY = cell.y-1 + y;
				var binaryString = toBinaryString(readSquareToArray(cellX-1, cellY-1, 3, 3));
				if(reference.tickCell(binaryString)){
					nextTick[toIndexOfKey({x:cellX, y:cellY})] = true;
				}
			}
		}
	})
	world = nextTick;
	io.emit('state', {
		world: readSquareToArray(0,0, width, height),
		clientStats: clientStats
	});

	// The start a new generation
  var activeClients = Object.keys(clients).filter(function (clientId) { return clientId != null; })

  // Send out tick request for each client's board
  activeClients.forEach(function (clientId) {
    sendCommand(clientId, 'tickBoard', {
      generation: generationId,
      result: clientWorlds[clientId]
    });
  });

  // Send out tick request for each cell
	if(activeClients.length > 0){
		Object.keys(world).forEach(function (liveCell, index, array) {
			var cell = getXYFromKey(liveCell);
			var binaryString = toBinaryString(readSquareToArray(cell.x-1, cell.y-1, 3, 3));
			sendCommand(activeClients[index % activeClients.length], 'tickCell', binaryString)
		})
	}
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
		world: readSquareToArray(0,0, width, height),
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
