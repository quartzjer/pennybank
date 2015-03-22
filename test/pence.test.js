var expect = require('chai').expect;
var crypto = require('crypto');
var libpence = require('../pence.js');

describe('pence', function(){

  it('should export an object', function(){
    expect(libpence).to.be.an('object');
  });

  it('should export a function', function(){
    expect(libpence.pence).to.be.a('function');
  });

  it('should generate a pence', function(){
    var pows = libpence.pence(10);
    expect(pows).to.be.an('object');
    expect(pows.p0.length).to.be.equal(5);
    expect(pows.pN.length).to.be.equal(5);
    expect(pows.digest.length).to.be.equal(32);
    expect(pows.ID.length).to.be.equal(20);
    expect(pows.N).to.be.equal(10);
  });

  it('should make identical', function(){
    var pence = libpence.pence(10);
    var pence2 = libpence.pence(10, pence.nonce, pence.p0);
    expect(pence.ID.toString('hex')).to.be.equal(pence2.ID.toString('hex'));
  });


});
