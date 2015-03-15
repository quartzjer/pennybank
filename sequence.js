var crypto = require('crypto');
var argv = require('minimist')(process.argv.slice(2));
var difficulty = require('./difficulty').difficulty;

// take given btc value and generate a satoshi pow sequence based on current difficulty
var satoshi = argv.btc * (100*100000);
if(!satoshi) return console.error('missing arg: --btc x');
difficulty(false, function(err, bits){
  
  // make easy bytes for now, TODO use real bitmasks
  var bytes = Math.ceil(bits/8);

  // start with a random head
  var head = crypto.randomBytes(bytes);

  // hash it forward for each satoshi at this difficulty
  var last = head;
  var start = Date.now();
  for(var j = 0; j < satoshi; j++)
  {
    var hash = crypto.createHash('sha256').update(last).digest();
    last = hash.slice(0,bytes);
  }
  
  console.log('head',head.toString('hex'),'tail',last.toString('hex'),'at',satoshi,'in',Date.now()-start,'ms');
  
});

