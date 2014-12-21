var expect = require('chai').expect;
var crypto = require('crypto');
var libchallenge = require('../challenge.js');

describe('challenge', function(){

  it('should export an object', function(){
    expect(libchallenge).to.be.an('object');
  });

  it('should export a function', function(){
    expect(libchallenge.Challenge).to.be.a('function');
  });

  it('should generate sets of challenges', function(){
    var sets = libchallenge.Challenge(10,16,10);
    expect(sets).to.be.an('object');

    expect(sets.challenges).to.be.an('object');
    expect(Object.keys(sets.challenges).length).to.be.equal(10);

    // check one set of challenges
    var cset = Object.keys(sets.challenges)[0];
    expect(cset).to.be.a('string');
    expect(cset.length).to.be.equal(64);
    expect(sets.challenges[cset]).to.be.an('array');
    expect(sets.challenges[cset].length).to.be.equal(10);
    expect(sets.secrets[cset]).to.be.an('object');
    expect(Object.keys(sets.secrets[cset]).length).to.be.equal(10);

    // check just one challenge
    var challenge = sets.challenges[cset][0];
    expect(challenge).to.be.a('string');
    expect(challenge.length).to.be.equal(64);
    var secret = sets.secrets[cset][challenge];
    expect(Buffer.isBuffer(secret)).to.be.true;
    expect(secret.length).to.be.equal(2); // the 16-bit difficulty, 2 raw bytes
    var hash = crypto.createHash('sha256').update(secret).digest('hex');
    expect(hash).to.be.equal(challenge);

  });

  it('should verify a set', function(){
    var sets = libchallenge.Challenge(10,16,1);
    expect(sets).to.be.an('object');
    var cset = Object.keys(sets.challenges)[0];
    
    expect(libchallenge.Verify(cset, sets.challenges[cset], sets.secrets[cset], 16)).to.be.true;
  });

  it('should not verify a bad challenge hash', function(){
    var sets = libchallenge.Challenge(10,16,1);
    expect(sets).to.be.an('object');
    var cset = Object.keys(sets.challenges)[0];
    sets.challenges[cset][5] = "abad";
    expect(libchallenge.Verify(cset, sets.challenges[cset], sets.secrets[cset], 16)).to.be.false;
  });

  it('should not verify a bad secret', function(){
    var sets = libchallenge.Challenge(10,16,1);
    expect(sets).to.be.an('object');
    var cset = Object.keys(sets.challenges)[0];
    sets.secrets[cset][sets.challenges[cset][5]] = crypto.randomBytes(2);
    expect(libchallenge.Verify(cset, sets.challenges[cset], sets.secrets[cset], 16)).to.be.false;
  });


});
