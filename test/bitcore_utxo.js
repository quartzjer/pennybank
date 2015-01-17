var expect = require('chai').expect;
var crypto = require('crypto');
var bitcore = require('bitcore');
var explorers = require('bitcore-explorers');
var insight = new explorers.Insight(bitcore.Networks.testnet);

var address = "myvsPNW9SgpmcGhBrYYowc5Q2cVHKqmuBP";

describe('challenge', function(){

  it('should have unspents', function(done){
    insight.getUnspentUtxos(address, function(err, utxos) {
      if (err) {
        console.log("insight utxo err",err);
        process.exit(1);
      }
      expect(utxos.length).to.be.above(0);
      utxos.forEach(function(utxo){
        console.log(address,utxo.toJSON());
      });
      done();
    });
  });
});
