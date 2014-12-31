var crypto = require('crypto');
var bitcore = require('bitcore');

var A_secret = crypto.randomBytes(16);
var B_secret = crypto.randomBytes(16);

function hash160(buf)
{
  var sha256 = crypto.createHash('sha256').update(buf).digest();
  return crypto.createHash('ripemd160').update(sha256).digest();
}

var A_hash = hash160(A_secret);
var B_hash = hash160(B_secret);

var P2CM = bitcore.Script()
  .add('OP_HASH160')
  .add(A_hash)
  .add('OP_EQUALVERIFY')
  .add('OP_HASH160')
  .add(B_hash)
  .add('OP_EQUAL');

var P2CM_IN = bitcore.Script().add(B_secret).add(A_secret);
var verified = bitcore.Script.Interpreter().verify(P2CM_IN, P2CM);
console.log(P2CM_IN,P2CM,verified);

