var http = require('https');
var bignum = require('bignum');
var argv = require('minimist')(process.argv.slice(2),{string:'hashestowin'});

difficulty(function(err, bits){
  console.log('bits required for a proof of one satoshi:',bits);
});

function difficulty(cbDone)
{
  fetch('hashestowin', function(err, data){
    var hashperblock = bignum(data); // a lot
    fetch('bcperblock', function(err, data){
      var btc = bignum(data); // 25.0 right now
      console.log('node difficulty.js --hashestowin',hashperblock.toString(),'--bcperblock',btc.toString());
      var satoshi = btc.mul(100*1000000); // convert into satoshi
      var hashespersatoshi = hashperblock.div(satoshi);
      console.log('hashes per satoshi:',hashespersatoshi.toString());
      var bits = Math.log(hashespersatoshi) / Math.log(2);
      cbDone(null, Math.ceil(bits));
    });
  });
}

function fetch(what, cbDone)
{
  // short-cut for local/offline testing
  if(argv[what]) return cbDone(null, argv[what]);

  // fetch current value
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
