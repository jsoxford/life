

function implementation(array){

  // flip values
  return array.map(function(i){
    return !i
  })

}


// --- the other stuff
var net = require('net'),
    JSONStream = require('JSONStream'),
    es = require('event-stream');


var client = net.connect({port: 3001}, function() {console.log('connected') });

client
  .pipe(JSONStream.parse(true))
  .pipe(es.mapSync(process))


// process a message from the server
function process(message){
  console.log(">>>>", message);
  if(message.action === 'processIteration'){
    var id       = Object.keys(message.payload)[0],
        data     = message.payload[id],
        solution = str2bin(implementation)(data),
        response = {
          respondingTo: "processIteration",
          payload:{}
        };

    response.payload[id] = solution;

    client.write(JSON.stringify(response));

    console.log("<<<<", response);
  }
}


function str2bin(fn){
  return function(str){
    return fn(
      str.split('').map(b)
    ).map(s).join('')
  }
  function b(v){
    return v == '1'
  }
  function s(v){
    return v ? '1':'0'
  }
}

