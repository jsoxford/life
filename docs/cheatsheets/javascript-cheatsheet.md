# Prerequisites

* A relatively up-to-date installation of [nodejs](http://nodejs.org/download/).
* The NPM package manager (bundled with newer versions of nodejs).

## Getting set up

Grab the client with `npm install -g coderetreat`.

You might need to add the `cr` executable to your `PATH`:

```bash
PATH=$PATH:./node_modules/coderetreat/bin
```

## Starting a session

Tests and code live in the same file. To get started you might use the following template:

```javascript
describe("numbers", function() {
  it("should be themselves", function() {
    (getANumber()).should.be.exactly(12);
  });
});

function getANumber(){
  return 12;
}
```

## Running tests

Run `cr path/to/my/session.js`. The client will watch the file for changes and print the results to the terminal. When your tests fail the details will also be printed.

## Writing tests

We're using [mocha](http://visionmedia.github.io/mocha/) and [should.js](https://github.com/shouldjs/should.js): these are included in your environment so you can just start hacking.

Check out the [should.js](https://github.com/shouldjs/should.js) page for examples of how to construct assertions.
