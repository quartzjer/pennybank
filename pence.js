var crypto = require('crypto');
var bignum = require('bignum');
var argv = require('minimist')(process.argv.slice(2));
var difficulty = require('./difficulty').difficulty;

// generate a pence of the given size
exports.pence = function(N, nonce){
  
  // start with a random nonce and p0
  if(!nonce) nonce = crypto.randomBytes(24);
  var p0 = crypto.randomBytes(5);
  
  // track the pence digest
  var digest = crypto.createHash('sha256').update(p0).digest()

  // hash it forward for each N at this difficulty
  var pN = p0;
  var buf = new Buffer(32);
  nonce.copy(buf); // initialize w/ nonce
  var seq = new Buffer(4);
  for(var j = 1; j <= N; j++)
  {
    seq.writeUInt32BE(j,0); // get seq in bytes
    seq.copy(buf,24,1,3); // write in the new sequence
    pN.copy(buf,27); // copy in last penny
    var hash = crypto.createHash('sha256').update(buf).digest();
    digest = crypto.createHash('sha256').update(digest).update(buf).digest();
    pN = hash.slice(0,5);
  }
  
  return {N:N, nonce:nonce, p0:p0, pN:pN, digest:digest, ID:crypto.createHash('ripemd160').update(digest).digest()};
};

// handy debugging to run as command line
if(process.argv[1].indexOf('pence.js') != -1)
{
  var satoshi = bignum(argv.btc * (100*1000000));
  if(!satoshi) return console.error('missing arg: --btc x');
  if(typeof argv.debug != 'boolean') argv.debug = true;
  difficulty(false, function(err, hashes){
    if(err) return console.error('errored',err);
    hashes = hashes.div(100*1000000); // hashes-per-satoshi
    var total = hashes.mul(satoshi);
    var count = total.div(bignum(2).pow(40)).toNumber();
    var start = Date.now();
    var pows = exports.pence(count);
    console.log('p0',pows.p0.toString('hex'),'pN',pows.pN.toString('hex'),'N',count,'in',Date.now()-start,'ms');
  });
}
