var expect = require('chai').expect;
var crypto = require('crypto');
var libdifficulty = require('../difficulty.js');

describe('difficulty', function(){

  it('should export an object', function(){
    expect(libdifficulty).to.be.an('object');
  });

  it('should export a function', function(){
    expect(libdifficulty.difficulty).to.be.a('function');
  });

  it('should generate a difficulty from fixed values', function(done){
    libdifficulty.difficulty({getdifficulty:'4.944639068824144E10',bcperblock:'2500000000'}, function(err, hashes){
      expect(err).to.not.exist();
      expect(hashes.toString()).to.be.equal('8494954859132248544');
      done();
    });
  });

  it('should fetch current difficulty from blockexplorer api', function(done){
    libdifficulty.difficulty({}, function(err, hashes){
      expect(err).to.not.exist();
      expect(hashes).to.exist();
      done();
    });
  });


});
