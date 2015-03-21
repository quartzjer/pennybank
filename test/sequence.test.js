var expect = require('chai').expect;
var crypto = require('crypto');
var libsequence = require('../sequence.js');

describe('sequence', function(){

  it('should export an object', function(){
    expect(libsequence).to.be.an('object');
  });

  it('should export a function', function(){
    expect(libsequence.sequence).to.be.a('function');
  });

  it('should generate a sequence', function(){
    var pows = libsequence.sequence(0.01,10);
    expect(pows).to.be.an('object');
    expect(pows.head.length).to.be.equal(2);
    expect(pows.tail.length).to.be.equal(2);
    expect(pows.digest.length).to.be.equal(32);
  });

  it('should bitmask', function(){
    var bytes = new Buffer('ffffffffffffffff','hex');
    var masked = libsequence.bitmask(1,bytes);
    expect(masked.toString('hex')).to.be.equal('80');
    var masked = libsequence.bitmask(10,bytes);
    expect(masked.toString('hex')).to.be.equal('ffc0');
    var masked = libsequence.bitmask(100,bytes);
    expect(masked.toString('hex')).to.be.equal('fffffffffffffff0');
  });


});
