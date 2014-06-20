var fs = require("fs");
var pubnub = require("pubnub").init({
    publish_key   : "pub-c-3819ce76-a6c1-4514-9d89-fc9808fec1df",
    subscribe_key : "sub-c-e45a82c6-f844-11e3-bafe-02ee2ddab7fe"
});


var sessionsDir = __dirname + '/../sessions';
var sessions = [];

// Read the sessions (first level directories) and populate an array so we can go through it later
fs.readdir(sessionsDir, function(err, fileList){
  fileList.forEach(function(session){
    var sessionPath = sessionsDir + '/' + session + '/index.js';
    fs.exists(sessionPath, function (exists) {
      if(exists){
        var session = require(sessionPath);
        announceSession(session, sessions.length);
        sessions.push(session);
      }
    });
  });
});

setInterval(function(){
  for (var i = 0; i < sessions.length; i++) {
    announceSession(sessions[i], i);
  }
}, 30000)


// Subscribe to a private channel (this instance's UUID) to receive instructions
// And trigger an evaluation if it does
var unique_channel = pubnub.uuid();
console.log('\tPubNub UUID: '+ unique_channel);
pubnub.subscribe({
  channel  : unique_channel,
  callback : function processCommand(message){
    console.log(message);
    pubnub.publish({
        channel   : 'cf_gol_results',
        message   : message,
        callback  : function(e) { console.log( "Processed generation", e ); },
        error     : function(e) { console.log( "FAILED! RETRY PUBLISH!", e ); }
    });
  }
});




// Send out an announcement about a session's authors, language, etc.
function announceSession(session, sessionId){
  var message = session.getInfo();
  message.processUUID = unique_channel;
  message.responderId  = sessionId;
  message.language = 'js';
  pubnub.publish({
      channel   : 'cf_gol_capabilities',
      message   : message,
      callback  : function(e) { console.log( "Sent:", e ); },
      error     : function(e) { console.log( "FAILED! RETRY PUBLISH!", e ); }
  });
}
