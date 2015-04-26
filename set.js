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
    ret.pence[p.ID.toString('hex')] = p.pN.toString('hex');
  }
  
  return ret;
}

exports.verify = function(set, secrets)
{
  // generate a set from each secret and remove it by ID
  var p0;
  while(p0 = secrets.pop())
  {
    var p = pence.pence(set.N, set.nonce, p0);
    var id = p.ID.toString('hex');
    if(!set.pence[id]) return false;
    // the pN must also match
    if(set.pence[id].toString('hex') != p.pN.toString('hex')) return false;
    delete set.pence[id];
  }

  // should only be one left un-verified
  if(Object.keys(set.pence).length != 1) return false;
  
  // all good
  return true;
}

// in browser
if(typeof window !== "undefined")
{
  window.libset = exports;
}
