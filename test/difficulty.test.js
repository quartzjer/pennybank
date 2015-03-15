var expect = require('chai').expect;
var crypto = require('crypto');
var libdifficulty = require('../difficulty.js');

describe('challenge', function(){

  it('should export an object', function(){
    expect(libdifficulty).to.be.an('object');
  });

  it('should export a function', function(){
    expect(libdifficulty.difficulty).to.be.a('function');
  });

  it('should generate a difficulty from fixed values', function(done){
    libdifficulty.difficulty({hashestowin:'203702905701946867973',bcperblock:'25'}, function(err, bits){
      expect(err).to.not.exist();
      expect(bits).to.be.equal(37);
      done();
    });
  });

  it('should fetch current difficulty from blockexplorer api', function(done){
    libdifficulty.difficulty({}, function(err, bits){
      expect(err).to.not.exist();
      expect(bits).to.be.above(32);
      done();
    });
  });


});
