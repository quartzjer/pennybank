# pay-to-hash-hash (P2HH)
```
scriptPubKey: OP_SHA256 <checkHash> OP_EQUALVERIFY OP_DUP OP_HASH160 <pubkeyHash> OP_EQUALVERIFY OP_CHECKSIG
scriptSig: <sig> <pubkey> <varHash>
```
* Becomes a valid P2SH after 0.10
* allows any secret to be exchanged between sender/recipient after the transaction
* allows secret to be based on a proof of work

## micro-transactions

* alice gets the current blockchain difficulty and generates lots of p2hh's with secrets of the current difficulty of the btc in them
* alice puts them all in a "budget" tx to bob's pubkey
* bob verifies and does same back in reverse, is “change” tx
* alice or bob can claim either tx anytime, but will cost high fees
* either can brute force any p2hh but claiming them may impose more fees, and "costs" the same to brute force (no incentive)
* each micro-tx involves bob and alice randomly picking a p2hh in the txns and exchanging the secret, verifying its difficulty matches (ending if not)
* anytime, either can send/require a “re-balance” of original tx with the current value unlocked in one output and fewer p2hh's, minimizes fees for both 
