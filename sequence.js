var crypto = require('crypto');
var argv = require('minimist')(process.argv.slice(2));
var difficulty = require('./difficulty').difficulty;

// take given btc value and generate a satoshi pow sequence based on current difficulty
exports.sequence = function(satoshi, bits){
  
  // start with a random head
  var head = exports.bitmask(bits, crypto.randomBytes(Math.ceil(bits/8)));

  // hash it forward for each satoshi at this difficulty
  var tail = head;
  for(var j = 0; j < satoshi; j++)
  {
    var hash = crypto.createHash('sha256').update(tail).digest();
    tail = exports.bitmask(bits, hash);
  }
  
  return {head:head, tail:tail};
};

// return just the masked bits from bytes
exports.bitmask = function(bits, bytes)
{
  var bbytes = new Buffer(bytes.slice(0,Math.ceil(bits/8)));
  var bbits = bits % 8;
  if(!bbits) return bbytes;
  var mask = 0;
  for(var i = 0; i < bbits; i++)
  {
    mask >>= 1;
    mask ^= 0x80;
  }
//  console.log(mask.toString(2),bbits,bbytes[bbytes.length-1].toString(2),(bbytes[bbytes.length-1]&mask).toString(2));
//  11000000 2 1001110 1000000
  bbytes[bbytes.length-1] &= mask;
  return bbytes;
}

// handy debugging to run as command line
if(process.argv[1].indexOf('sequence.js') != -1)
{
  var satoshi = argv.btc * (100*100000);
  if(!satoshi) return console.error('missing arg: --btc x');
  if(typeof argv.debug != 'boolean') argv.debug = true;
  difficulty(false, function(err, bits){
    if(err) return console.log('errored',err);
    var start = Date.now();
    var pows = exports.sequence(satoshi, bits);
    console.log('head',pows.head.toString('hex'),'tail',pows.tail.toString('hex'),'at',satoshi,'in',Date.now()-start,'ms');
  });
}
