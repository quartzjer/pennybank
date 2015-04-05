var http = require('https');
var bignum = require('bignum');
var argv = require('minimist')(process.argv.slice(2),{string:'getdifficulty'});

// export a current difficulty fetch/calc
exports.difficulty = function(args, cbDone)
{
  if(args) argv = args;
  fetch('getdifficulty', function(err, data){
    var difficulty = bignum(parseInt(JSON.parse(data))); // "4.944639068824144E10"
    var hashperblock = difficulty.mul(bignum(2).pow(48)).div(0xffff); // https://en.bitcoin.it/wiki/Difficulty#What_network_hash_rate_results_in_a_given_difficulty.3F
    fetch('bcperblock', function(err, data){
      var btc = bignum(data).div(100000000); // 2500000000 right now
      if(argv.debug) console.log('node difficulty.js --getdifficulty',difficulty.toString(),'--bcperblock',data);
      var hashes = hashperblock.div(btc);
      if(argv.debug) console.log('hashes per btc:',hashes.toString());
      cbDone(err, hashes, difficulty);
    });
  });
}

// handy debugging to run as command line
if(process && process.argv[1] && process.argv[1].indexOf('difficulty.js') != -1)
{
  if(typeof argv.debug != 'boolean') argv.debug = true;
  exports.difficulty(false, function(err, hashes){
    if(err) return console.log('errored',err);
    console.log('current hashes required per bitcoin:',hashes);
    console.log('current hashes required per satoshi:',hashes.div(100000000));
  });
}

// in browser
if(typeof window !== "undefined")
{
  window.difficulty = exports.difficulty;
  window.bignum = bignum;
}

function fetch(what, cbDone)
{
  // short-cut for local/offline testing
  if(argv[what]) return cbDone(null, argv[what]);

  // fetch current value
  if(argv.debug) console.log('fetching current',what);
  http.get({
    protocol: 'https:',
    host: 'blockchain.info',
    path: '/q/'+what+'?cors=true',
    withCredentials: false
  }, function(resp) {
    var body = '';
    resp.on('data', function(d) {
      body += d;
    });
    resp.on('end', function() {
      cbDone(null, body);
    });
  });
  
}
