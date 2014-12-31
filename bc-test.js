var crypto = require('crypto');
var bitcore = require('bitcore');

var secret = new Buffer('pennybank');
var p2h1_in = bitcore.Script().add(secret);
console.log(p2h1_in);

var hash1 = crypto.createHash('sha256').update(secret).digest();
var hash2 = crypto.createHash('sha256').update(hash1).digest();

var p2h1 = bitcore.Script().add('OP_HASH256').add(hash2).add('OP_EQUALVERIFY');
console.log(p2h1);

verified = bitcore.Script.Interpreter().verify(p2h1_in, p2h1);
console.log(verified);

var int = bitcore.Script.Interpreter();
var verified = int.verify(p2h1_in, p2h1);
console.log(verified, int.errstr);

var p2sh = p2h1.toScriptHashOut();
console.log(p2sh,bitcore.Script.Interpreter().verify(p2h1, p2sh));

var test = bitcore.Script().add(secret).add('OP_HASH256').add(hash2).add('OP_EQUALVERIFY');
console.log(test,bitcore.Script.Interpreter().verify(bitcore.Script().add('OP_NOP'), p2h1));

var i = bitcore.Script.Interpreter();
i.set({script:test});
console.log(i.evaluate());

var p2h1 = bitcore.Script().add('OP_HASH256').add(hash2).add('OP_EQUAL');
console.log(p2h1);

verified = bitcore.Script.Interpreter().verify(p2h1_in, p2h1);
console.log(verified);

////////

var a_secret = new Buffer('pennybank');
var a_p2h1_in = bitcore.Script().add(a_secret);
var b_secret = new Buffer('pennybank');
var b_p2h1_in = bitcore.Script().add(b_secret);
console.log(a_p2h1_in,b_p2h1_in);

var a_hash1 = crypto.createHash('sha256').update(a_secret).digest();
var a_hash2 = crypto.createHash('sha256').update(a_hash1).digest();

var b_hash1 = crypto.createHash('sha256').update(b_secret).digest();
var b_hash2 = crypto.createHash('sha256').update(b_hash1).digest();

var x_p2h1 = bitcore.Script().add('OP_HASH256').add(a_hash2).add('OP_EQUALVERIFY').add('OP_HASH256').add(b_hash2).add('OP_EQUAL');
console.log(x_p2h1);

verified = bitcore.Script.Interpreter().verify(bitcore.Script().add(b_secret).add(a_secret), x_p2h1);
console.log(verified);
