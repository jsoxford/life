var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Set up PubNub bits
var pubnub = require("pubnub").init({
    publish_key   : "pub-c-3819ce76-a6c1-4514-9d89-fc9808fec1df",
    subscribe_key : "sub-c-e45a82c6-f844-11e3-bafe-02ee2ddab7fe"
});

// Whenever we get a new client, add it to the list
var sessions = [];
pubnub.subscribe({
    channel  : "cf_gol_capabilities",
    callback : function(message) {
      message.lastContact = new Date();
      sessions[message.processUUID + '-' + message.responderId] = message;
      console.log("----");
      console.log(sessions);
    }
});

app.use(express.static(__dirname + '/public'));

// todo - use buffer
var world = new Array(100*100);

setInterval(function(){
  for (var i = world.length - 1; i >= 0; i--) {
    world[i] = Math.random() > .5;
  }

  io.emit('state', {
    world:world,
    players:sessions
    });
}, 1000)



http.listen(3000, function(){
  console.log('listening on *:3000');
});
