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
    var unspent = unspents.pop()

    var tx = new bitcoin.TransactionBuilder()

    var data = new Buffer('cafedeadbeef', 'hex')
    var dataScript = bitcoin.scripts.nullDataOutput(data)

    tx.addInput(unspent.txHash, unspent.index)
    tx.addOutput(dataScript, 1000)
    tx.sign(0, key)

    var hex = tx.build().toHex();
    console.log("HEX",hex);
    helloblock.transactions.propagate(hex, function(err) {
      if (err) return done(err)

      // check that the message was propagated
      helloblock.addresses.getTransactions(address, function(err, res, transactions) {
        if (err) return done(err)

        var transaction = transactions[0]
        var output = transaction.outputs[0]
        var dataScript2 = bitcoin.Script.fromHex(output.scriptPubKey)
        var data2 = dataScript2.chunks[1]

        console.log("TEST",dataScript,data);

        done()
      })
    })
  })
})