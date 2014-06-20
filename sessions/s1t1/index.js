exports.getInfo = function(){
  return {
    authors: [
      {name: 'Ryan Brooks', twitter: '@spikeheap'},
      {name: 'Ben Foxall', twitter: '@benjaminbenben'}
    ],
    session: 1
  }
}

exports.generateIteration = function(gen0) {
  consele.log(gen0);
  return Math.random() > 0.5
}
