var expect = require('chai').expect;

var crypto = require('crypto');
var bitcore = require('bitcore');

var A_secret = crypto.randomBytes(16);
var B_secret = crypto.randomBytes(16);

console.log("secrets",A_secret.toString('hex'),B_secret.toString('hex'));

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

// test multisig
var privateKey1 = new bitcore.PrivateKey('KwF9LjRraetZuEjR8VqEq539z137LW5anYDUnVK11vM3mNMHTWb4');
var privateKey2 = new bitcore.PrivateKey('L4PqnaPTCkYhAqH3YQmefjxQP6zRcF4EJbdGqR8v6adtG9XSsadY');
var publicKey1 = privateKey1.publicKey;
var publicKey2 = privateKey2.publicKey;
var P2SHScript = new bitcore.Script.buildMultisigOut([publicKey1, publicKey2], 1);
console.log(P2SHScript.toString());
var P2SHFund = P2SHScript.toScriptHashOut();
console.log(P2SHFund);
var address = P2SHFund.toAddress();
console.log(address);


// first we create a transaction
var uxto = {
  address: address,
  txId: '66e64ef8a3b384164b78453fa8c8194de9a473ba14f89485a0e433699daec140',
  outputIndex: 0,
  script: P2SHFund,
  satoshis: 100000
};
var tx = new bitcore.Transaction().from(uxto,[publicKey1],1).to(P2SHFund.toAddress(), 100000).sign(privateKey1);
//console.log(tx.inputs[0].getSignatures(tx, privateKey1, 0));
var signature = tx.getSignatures(privateKey1)[0].signature.toBuffer();
console.log(signature);

var P2SH_IN = bitcore.Script().add(signature);
var verified = bitcore.Script.Interpreter().verify(P2SH_IN, P2SHScript);
console.log(P2SH_IN,verified);

