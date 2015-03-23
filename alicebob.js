var libset = require('./set.js');

// example code showing flow of an Alice / Bob exchange

var Alice = {who:'Alice'};
var Bob = {who:'Bob'};

// Alice generates a new set
Alice.set = libset.generate(1000);

// Alice uses the shareable parts in an open
Alice.open = {pence:Alice.set.pence, N:Alice.set.N, nonce:Alice.set.nonce};

// Alice sends open to Bob

// Bob generates a set and open response
Bob.set = libset.generate(Alice.open.N);
Bob.open = {pence:Bob.set.pence, N:Bob.set.N, nonce:Bob.set.nonce};

// Bob selects one pence randomly from Alice's open
var random = Math.floor(Math.random()*100);
Bob.Alice = {N:Alice.open.N, nonce:Alice.open.nonce};
Bob.Alice.ID = Object.keys(Alice.open.pence)[random];
Bob.Alice.pN = Alice.open.pence[Bob.Alice.ID];
Bob.open.ID = Bob.Alice.ID; // to send back to Alice

// Bob sends the open response to Alice

// Alice selects one pence randomly from Bob's open
var random = Math.floor(Math.random()*100);
Alice.Bob = {N:Bob.open.N, nonce:Bob.open.nonce};
Alice.Bob.ID = Object.keys(Bob.open.pence)[random];
Alice.Bob.pN = Bob.open.pence[Alice.Bob.ID];

// Alice generates confirmation for Bob
Alice.secret = Alice.set.secrets[Bob.open.ID];
delete Alice.set.pence[Bob.open.ID];
Alice.opened = {ID:Alice.Bob.ID};
Alice.opened.secrets = Object.keys(Alice.set.pence).map(function(id){return Alice.set.secrets[id].p0;});

// Alice sends opened to Bob

// Bob verifies secrets
libset.verify(Bob.Alice, Alice.opened.secrets);

// Bob creates final response
Bob.secret = Bob.set.secrets[Alice.opened.ID];
delete Bob.set.pence[Alice.opened.ID];
Bob.opened = {};
Bob.opened.secrets = Object.keys(Bob.set.pence).map(function(id){return Bob.set.secrets[id].p0;});

// Bob sends opened to Alice

// Alice verifies, fully negotiated mutual pence
libset.verify(Alice.Bob, Bob.opened.secrets);
