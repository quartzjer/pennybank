var libchallenge = require('./challenge.js');

// WIP, just pseudo-code yet of one exchange to start, in reality two exchanges are happening both ways simultaneously

/*

// bob advertises required penny bank details to alice, the confidence (number of sets), and quantity and cost of each microtx

// alice generates sets
var alice_sets = libchallenge.Challenge(transactions, bits, quantity);

// alice sends bob the hashes to initiate a penny bank verification
alice.send(bob, alice_sets.challenges);

// bob chooses one of the sets to use at random and tells alice
var bob_alice_selected = alice_challenges[random];
bob.send(alice, bob_alice_selected);

// alice sends bob all the secrets of the other sets, except the selected
var alice_bob_secrets = alice_sets.secrets[bob_alice_selected]; // remove it
alice.send(bob, alice_sets.secrets);

// bob verifies the secrets
bob.verify(alice_sets.secrets, transactions, bits);

// now bob has a set of proof of work hashes of a known size
// TODO, create the PB transaction using the P2H2 of bob_alice_selected 

*/