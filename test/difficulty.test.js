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
    libdifficulty.difficulty({hashestowin:'203702905701946867973',bcperblock:'25'}, function(err, hashes){
      expect(err).to.not.exist();
      expect(hashes.toString()).to.be.equal('8148116228077874718');
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
