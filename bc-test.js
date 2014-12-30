var bitcore = require('bitcore');

var s = bitcore.Script.fromString('OP_HASH256 32 0x426fd073be3df73f399965c1766b2519b0341f8ff1461c11fd27223be67952ad OP_EQUALVERIFY');
console.log(s, s.classify());

var p2sh = bitcore.Script.buildScriptHashOut(s);
console.log(p2sh);