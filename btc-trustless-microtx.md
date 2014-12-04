# Trustless Micro-Transactions

## Abstract

This defines a simple process for two parties to safely exchange miniscule amounts of bitcoin without requiring trust in the other party, timelocks, or creating many fee-burdened dust transactions.

## Motivation

With the rules for accepted P2SH opcodes relaxing [in 0.10](https://github.com/bitcoin/bitcoin/pull/4365), new types of scripts can be used in transactions and will accepted into the blockchain by updated miners.  While many opcodes are still diabled to minimize the risk of a fork, only a `OP_HASH256` is required to enable micro-transactions.

The current [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party) technique works within the current limits and has had some early adoption, but it can now be significantly simplified and aligned with the core value structure of the blockchain, proof-of-work based hashing.

## Specification

First, two new standard P2SH scripts are defined

### pay-to-hash (P2H)
```
scriptPubKey: OP_HASH256 <checkHash> OP_EQUALVERIFY
scriptSig: <data>
```
This allows anyone with the correct `<data>` to spend it, you may recognize it from the [transaction puzzle example](https://en.bitcoin.it/wiki/Script#Transaction_puzzle).  These types of P2H transactions can now be commonly used to anonymously exchange value based on any secret, as well as the foundation of a proof-of-work when the size of the `<data>` is fixed/known.

### pay-to-hash-hash (P2H2)
```
scriptPubKey: OP_HASH256 <checkHash> OP_EQUALVERIFY OP_DUP OP_HASH160 <pubkeyHash> OP_EQUALVERIFY OP_CHECKSIG
scriptSig: <sig> <pubkey> <data>
```
In order to lock a P2H it can be combined with a standard [P2PKH](https://en.bitcoin.it/wiki/Script#Standard_Transaction_to_Bitcoin_address_.28pay-to-pubkey-hash.29), such that both the data and a private key are required.

### micro-transactions

#### proof of work difficulty

The value of every bitcoin is backed by the current [difficulty](https://en.bitcoin.it/wiki/Difficulty), which reduces to a number of hashes-per-satoshi ([example formula](http://bitcoin.stackexchange.com/questions/12013/how-many-hashes-create-one-bitcoin/12030#12030).  Currently, the difficulty of [40007470271.271](https://bitcoinwisdom.com/bitcoin/difficulty) results in approximately [65 hashes](https://www.google.com/#q=((270%2C591%2C326+*+60+*+10)+%2F+25)+%2F+100%2C000%2C000) to back the value of one satoshi.  A proof of work for one satoshi would then require between 6 and 7 bits, where a random bitstring of that size when hashed, would require an average of 65 hashes of the same size bitstring to find a match.

#### "budget" transaction

> documentation here is a higher level work in progress and needs to be synchronized with the micropayment channel patterns

When Alice wants to perform a microtransaction with Bob, they begin by creating a budget transaction that is high enough to avoid or minimize transaction fees, and then calculate the size of each microtransaction required and generate a P2HH for each one with the correct number of bits for the current difficulty.  The budget transaction contains all of the individual P2HH scripts and is generally very large and would be unfeasible to use as-is due to fees, but provides a guarantee to Bob that the value is budgeted.

Bob needs to verify the difficulty of the contained P2HH's, so picks one at random and challenges Alice to unlock it by sending the secret and validating that the bits in the secret match the current difficulty for each microtransaction (a partial/confidence-based [zero-knowledge proof](http://en.wikipedia.org/wiki/Zero-knowledge_proof) of the difficulty).  Once Bob is confident that the value is contained, they generate and send a budget transaction back to Alice that contains a direct P2PKH refund of most of the value, and the number of P2HH microtransactions for the value spent so far.

As Alice and Bob exchange the actual small asset/values represented by a microtransaction, Bob continues to request a P2HH and Alice provides the secret.  At any point either side may request a re-balance, exchanging updated budget transactions with larger/smaller direct P2PKH's.

Need to expand yet on these points:

* provides a way to prove the budget is available and each P2HH unlocks that amount of value
* in the beginning the incentive is to cooperate since transaction fees would be too high to claim the small values
* since the brute force of a proof-of-work P2HH requires as many hashes as mining, there is no incentive to crack them
* if either side abandons the budget transaction, it can be held onto as an asset that will still increase in value
* the budget transactions can be easily combined with multi-key ones to add arbitration, locked to sidechains, include OP_RETURNs, etc
