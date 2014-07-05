## Development

### Contributing

This project welcomes pull requests! We also love issues and generally knowing that this project is (or at least could be) useful! Reach out to us in comments, issues or [on Twitter](https://twitter.com/intent/user?screen_name=jsoxford).

### Local testing
You can use `netcat` to simulate the server and send messages:

```bash
netcat -lp 8787
```

## Building a client

### Client guidelines

1. The client is installed using the de-facto package manager for the language
2. The client is executed using `cr path-to-file` for consistency across languages.

### Client responsibilities

In a rough order of importance:

1. Watch the provided file for changes and run the tests provided in the file on every change. Output can be provided to the console or a live-reloading webpage.
2. Grab the current life server from http://jsoxford.com/cr.json.
3. For each run of the test suite, send the statistics to the life server.
4. Listen for `tickCell` events, delegate them to a function in the provided file named `tickCell`, and return the result.
5. Listen for `tickBoard` events, delegate them to a function in the provided file named `tickBoard`, and return the result.


### Grabbing the life server IP address

The IP address of the latest server is available from http://jsoxford.com/cr.json, which returns a file like:

```json
{
  "client_version": "0.0.1",
  "endpoint": {
    "host": "127.0.0.1",
    "port": 8787
  }
}
```

### Messaging

The `coderetreat` wrapper communicates with a central stats-collecting server using simple stream connections and JSON payloads.


#### Stats update

Whenever a test is run the stats are posted to the server in the following format:
```json
{
  "action": "consumeTestsResults",
  "payload": {
    "testsRun": 10,
    "testsFailed": 5,
    "testsIgnored": 2
  }
}
```

This is the only unsolicited transmission from client.


#### Calculate the next generation for a given cell

The server requests the `tickCell` action and provides a `payload` containing the generation ID and the current cell and neighbours.

The `result` field should be passed to a call of `tickCell` in the externally-loaded code.

* The `generation` field is a positive integer, used to synchronise responses.
* `result` contains the 3x3 grid including the cell and all its neighbours, with `0` representing current death and `1` representing life. It is left-to-right, top-to-bottom, so the indices of each cell are as follows (the current cell is at `4`):

| | | |
|-|-|-|
|0|1|2|
|3|__4__|5|
|6|7|8|

The message structure is as follows:
```json
{
  "action": "tickCell",
  "payload": {
      "generation": 12,
      "x": 4,
      "y": 12,
      "result": "000010010"
    }
}
```
Responses should include the received payload in the response, with the result being true` for life and `false` for death in the subsequent iteration:
```json
{
  "success": true,
  "respondingTo": "tickCell",
  "payload":{
    "generation": 12,
    "lives": true,
    "from: "010010010",
    "x": 4, 
    "y": 12
  }
}
```

#### Calculate the next generation for a given board

The server requests an iteration similar to `tickCell`, however the `result` object is a list of x/y coordinates of live cells:


```json
{
  "action": "tickBoard",
  "payload": {
      "generation": 23,
      "result": [{"x":1, "y":2}, {"x":22, "y":4}, ]
    }
}
```

The response again mirrors `tickCell`:

```json
{
  "success": true,
  "respondingTo": "tickBoard",
  "payload":[
    {"generation": 23, "result": [{"x":1, "y":2}, {"x":22, "y":4}] },
    {"generation": 24, "result": [{"x":3, "y":1}] }
  ]
}
```


#### Failure
The client can fail silently, or return a meaningful message to the serve as follows:

```json
{
  "success": false,
  "respondingTo": "processIteration",
  "payload": {
    "error": "The function could not be executed."
  }
}
```
