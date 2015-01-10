var crypto = require('crypto');
var bitcore = require('bitcore');

var address = process.argv[2];

var insight = new bitcore.transport.explorers.Insight(bitcore.Networks.testnet);
insight.getUnspentUtxos(address, function(err, utxos) {
  if (err) {
    console.log("insight utxo err",err);
    process.exit(1);
  }
  utxos.forEach(function(utxo){
    console.log(address,utxo.toJSON());
  });
});
