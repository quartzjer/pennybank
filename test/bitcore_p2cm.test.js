var expect = require('chai').expect;

var crypto = require('crypto');
var bitcore = require('bitcore');
var Sighash = require('../node_modules/bitcore/lib/transaction/sighash'); // temporary workaround
var explorers = require('bitcore-explorers');
var insight = new explorers.Insight(bitcore.Networks.testnet);

// example successful testnet p2cm http://explorer.chain.com/transactions/22ac9b05f765ac5c7e830b826718f1c43a686f7d398c00bc84bf1c79d51d4499

// testnet
var privateKey = bitcore.PrivateKey({
  "bn":"8c026a359a13f707a3497ef58da45b628958ff98b5f33322cf29ede12fcfd56f",
  "compressed":true,
  "network":"testnet"
});
var address = privateKey.toAddress();
console.log("address",address);

describe('challenge', function(){

  it('should p2cm', function(done){
    getUTXO(address, function(utxo){
      console.log(utxo.toJSON());
  
      // test sending a small bit to a p2cm
      var privateKey1 = new bitcore.PrivateKey('612b3ca3f368cf2658c2e1777d2fa28e6bcde8ea19312cbf69e09e7333e13994',bitcore.Networks.testnet);
      var privateKey2 = new bitcore.PrivateKey('d65788b9947b41625ffff946bc145187c6b85d1686e60becdf34567f17478730',bitcore.Networks.testnet);
      var publicKey1 = privateKey1.publicKey;
      var publicKey2 = privateKey2.publicKey;

      var P2CMScript = new bitcore.Script.buildMultisigOut([publicKey1, publicKey2], 1);

      // now do the secrets/hashing part
      var A_secret = new Buffer("a236d85656fb05bf157d5328f191c7e6","hex");
      var B_secret = new Buffer("65b3e07dbb2861cad500906e1af5c2c6","hex");
  
      // prepend (in reverse order)
      P2CMScript
      .prepend('OP_EQUALVERIFY')
      .prepend(hash160(B_secret))
      .prepend('OP_HASH160')
      .prepend('OP_EQUALVERIFY')
      .prepend(hash160(A_secret))
      .prepend('OP_HASH160')

      console.log(P2CMScript.toString());

      var P2SHFund = P2CMScript.toScriptHashOut();
  
      var tx = new bitcore.Transaction()
        .from(utxo)
        .to(P2SHFund.toAddress(), 20000)
        .change(address)
        .fee(10000)
        .sign(privateKey); 

      console.log("tx",tx);

      broadcast(tx, function(id){
        console.log("funded to",id);

        var tx2 = new bitcore.Transaction()
          .from({txId:id, outputIndex:0, inputIndex:0, satoshis:20000, script:P2SHFund.toString()}, [publicKey1, publicKey2], 1, P2CMScript)
          .to(address, 10000)
          .fee(10000)
          .sign(privateKey1);

        var s = tx2.inputs[0].script;
        console.log('\ntx2 input script',s);
        var data = s.chunks.pop(); // remove the last item, the p2sh input data
        s.add(B_secret); // add secret data to match the p2cm script
        s.add(A_secret);
        s.add(data); // put the p2sh input data back at the end

/*
        // work around hard-wired multisig to get the signature (TODO make a real input class for P2CM)
    var signature = Sighash.sign(tx2, privateKey1, 1, 0, P2CMScript).toBuffer();
        console.log("tx2 signed",signature.toString("hex"));
          
        // create a scriptsig with the valid secrets to redeem
        var s = new bitcore.Script();
        s.add('OP_0');
        s.add(Buffer.concat([signature,new Buffer("00","hex")]);
        s.add(B_secret);
        s.add(A_secret);
        s.add(P2CMScript.toBuffer());
        console.log("INPUT",s.toString());
*/
        // replace w/ our updated script
        tx2.inputs[0].setScript(s);

        console.log("\ntx2 json",tx2.toJSON());
        console.log("\ntx2 raw hex",tx2.serialize())
        broadcast(tx2, function(id2){
          console.log("funded back to",id2);
          expect(id2).to.exist();
          done()
        });
    
      });
  
    });
  });
});



function broadcast(tx, done)
{
  insight.broadcast(tx, function(err, id) {
    expect(err).to.not.exist();
    done(id);
  });
}

function getUTXO(address, done)
{
  insight.getUnspentUtxos(address, function(err, utxos) {
    expect(err).to.not.exist();
    var max = utxos[0];
    utxos.forEach(function(utxo){
      if(utxo.satoshis > max.satoshis) max = utxo;
//      console.log(utxo.toJSON());
    });
    done(max);
  });
}

function hash160(buf)
{
  var sha256 = crypto.createHash('sha256').update(buf).digest();
  return crypto.createHash('ripemd160').update(sha256).digest();
}

