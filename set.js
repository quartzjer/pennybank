// this creates/verifies sets of proof of work challenges

var crypto = require('crypto');
var pence = require('./pence');

exports.generate = function(N)
{
  var ret = {N:N};
  ret.pence = {};
  ret.secrets = {};
  ret.nonce = crypto.randomBytes(24);

  for(var i = 0; i < 100; i++)
  {
    var p = pence.pence(N, ret.nonce);
    ret.secrets[p.ID.toString('hex')] = p;
    ret.pence[p.ID.toString('hex')] = crypto.createHash('sha256').update(p.pN).digest('hex');
  }
  
  return ret;
}

exports.verify = function(set, secrets)
{
  for(var i = 0; i < 99; i++)
  {
    var secret = secrets.pop();
    if(!secret) return false;
    // TODO
  }
  
  // all good
  return true;
}
