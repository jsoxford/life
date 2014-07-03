# life

## Starting the server

```
npm install
node index.js
```

## Running the example app

```
node example.js
```

### SEE THE GAME

[locahost:3000](http://localhost:3000)



# Dev notes


### Finding the server

Clients should look for a JSON file at `http://jsoxford.com/cr.json` which contains the location of the server:
```json
{
  "client_version": "0.0.1",
  "endpoint": {
    "host": "192.168.0.42",
    "port": 4242
  }
}
```
