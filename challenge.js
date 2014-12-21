// this creates a series of proof of work challenge sets

var crypto = require('crypto');

exports.Challenge = function(quantity, difficulty, sets)
{
  var ret = {q:quantity, d:difficulty, s:sets};
  ret.challenges = {};
  ret.secrets = {};

  // TODO, use exact bits
  ret.d = Math.ceil(ret.d/8);

  for(var i = 0; i < sets; i++)
  {
    // generate a map of all the challenges by hash->secret
    var secrets = {};
    for(var j = 0; j < quantity; j++)
    {
      var secret = crypto.randomBytes(ret.d);
      var hash = crypto.createHash('sha256').update(secret).digest('hex');
      secrets[hash] = secret;
    }

    // turn it into a sorted list of just the hashes to share
    var hashes = Object.keys(secrets).sort();
    // concat the sorted secrets
    var csecret = Buffer.concat(hashes.map(function(hash){ return secrets[hash]; }));
    // generate the hash to identify the whole thing
    var chash = crypto.createHash('sha256').update(csecret).digest('hex');
    
    // one challenge set
    ret.challenges[chash] = hashes;
    ret.secrets[chash] = secrets;
  }
  
  return ret;
}