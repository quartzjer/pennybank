var crypto = require('crypto');
var bitcoin = require("bitcoinjs-lib")
var helloblock = require('helloblock-js')({
  network: 'testnet'
})

// placeholder! this is just some op_return sample code from helloblock-js

function done(err)
{
  if(err) console.log("ERR",err);
  process.exit(0);
}

var key = bitcoin.ECKey.fromWIF("L1uyy5qTuGrVXrmrsvHWHgVzW9kKdrp27wBC7Vs6nZDTF2BRUVwy")
var address = key.pub.getAddress(bitcoin.networks.testnet).toString()

helloblock.faucet.withdraw(address, 2e4, function(err) {
  if (err) return done(err)

  helloblock.addresses.getUnspents(address, function(err, _, unspents) {
    if (err) return done(err)

    // filter small unspents
    unspents = unspents.filter(function(unspent) { return unspent.value > 1e4 })

    // use the oldest unspent
    var unspent = unspents.pop();
//    helloblock.transactions.get(unspent.txHash, function(err, res, transaction) {
//      if (err) return done(err)
//        console.log("unspent",unspent,transaction);
//    });

    var tx = new bitcoin.TransactionBuilder()

//    var redeemScript = bitcoin.scripts.multisigOutput(2, pubKeys) // 2 of 3
//    var scriptPubKey = bitcoin.scripts.scriptHashOutput(redeemScript.getHash())
//    var address = bitcoin.Address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet).toString()

//    var data = new Buffer('cafedeadbeef', 'hex')
//    var dataScript = bitcoin.Script.fromChunks([bitcoin.opcodes.OP_RETURN, data]);
    
    var secret = crypto.randomBytes(4);
    var hash = crypto.createHash('sha256').update(secret).digest();
    var hashScript = bitcoin.Script.fromChunks([bitcoin.opcodes.OP_HASH256, hash, bitcoin.opcodes.OP_EQUALVERIFY]);

    tx.addInput(unspent.txHash, unspent.index)
    tx.addOutput(hashScript, 2000)
    tx.sign(0, key)

    var hex = tx.build().toHex();
    console.log("TX-HEX",hex);
    helloblock.transactions.propagate(hex, function(err) {
      if (err) return done(err)

      // check that the message was propagated
      helloblock.addresses.getTransactions(address, function(err, res, transactions) {
        if (err) return done(err)

        var transaction = transactions[0]
        var output = transaction.outputs[0]
        var hashScript2 = bitcoin.Script.fromHex(output.scriptPubKey)
        var hash2 = hashScript2.chunks[1]

        console.log(hash.toString('hex'),hash2.toString('hex'));
//        console.log(transaction);

        // build another transaction to spend the P2H1
        var tx2 = new bitcoin.TransactionBuilder();
        var data = new Buffer('cafedeadbeef', 'hex')
        var dataScript = bitcoin.Script.fromChunks([bitcoin.opcodes.OP_RETURN, data]);
        tx2.addInput(transaction.txHash, 0)
        tx2.addOutput(dataScript, 1000)
        tx2.sign(0, key)
// TODO trying to figure out bitcoin-lib's internals to add the hash to the tx to validate the P2H1 script
//        tx2.tx.setInputScript(0, hash);

        var hex2 = tx2.build().toHex();
//        var hex2 = tx2.tx.toHex();
        console.log("TX2-HEX",hex2);

        helloblock.transactions.propagate(hex2, function(err) {
          if (err) return done(err)

          // check that the message was propagated
          helloblock.transactions.get(hex2, function(err, res, transaction) {
            if (err) return done(err);
            console.log("DONE",transaction);
            done()
          })
        })
      })
    })
  })
})