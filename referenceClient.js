exports.tickCell = function (generation0) {
  var liveCellsIncludingSelf = generation0.match(/1/g) || 0;
  if (generation0[4] === '1') {

    // Any live cell with fewer than two live neighbours dies, as if caused by under-population.
    if (liveCellsIncludingSelf.length < 3) {
      return false;
    }

    // Any live cell with two or three live neighbours lives on to the next generation.
    else if (liveCellsIncludingSelf.length == 3 || liveCellsIncludingSelf.length == 4) {
      return true;
    }

    // Any live cell with more than three live neighbours dies, as if by overcrowding.
    else {
      return false;
    }

  }
  else{
    // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
    if (liveCellsIncludingSelf.length == 3) {
      return true;
    }
    else {
      return false;
    }
  }
  return 'x';
};

exports.tickBoard = function (generation0) {
  // FIXME implement!
  return generation0;
};
