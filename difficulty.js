var http = require('https');
var bignum = require('bignum');
var argv = require('minimist')(process.argv.slice(2),{string:'hashestowin'});

// export a current difficulty fetch/calc
exports.difficulty = function(args, cbDone)
{
  if(args) argv = args;
  fetch('hashestowin', function(err, data){
    var hashperblock = bignum(data); // a lot
    fetch('bcperblock', function(err, data){
      var btc = bignum(data); // 25.0 right now
      if(argv.debug) console.log('node difficulty.js --hashestowin',hashperblock.toString(),'--bcperblock',btc.toString());
      var satoshi = btc.mul(100*1000000); // convert into satoshi
      var hashespersatoshi = hashperblock.div(satoshi);
      if(argv.debug) console.log('hashes per satoshi:',hashespersatoshi.toString());
      var bits = Math.log(hashespersatoshi) / Math.log(2);
      cbDone(err, Math.ceil(bits), hashespersatoshi);
    });
  });
}

// handy debugging to run as command line
if(process.argv[1].indexOf('difficulty.js') != -1)
{
  if(typeof argv.debug != 'boolean') argv.debug = true;
  exports.difficulty(false, function(err, bits){
    if(err) return console.log('errored',err);
    console.log('bits required for a proof of one satoshi:',bits);
  });
}

function fetch(what, cbDone)
{
  // short-cut for local/offline testing
  if(argv[what]) return cbDone(null, argv[what]);

  // fetch current value
  if(argv.debug) console.log('fetching current',what);
  http.get({
    host: 'blockexplorer.com',
    path: '/q/'+what
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
