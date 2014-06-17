process.exports = function(state){
  return state.map(function(v){ return !v })
}