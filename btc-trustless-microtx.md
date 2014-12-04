# Trustless Micro-Transactions

## Abstract

This defines a simple process for two parties to safely exchange miniscule amounts of bitcoin without requiring trust in the other party, timelocks, refunds, or creating many fee-burdened dust transactions.

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

The value of every bitcoin is backed by the current [difficulty](https://en.bitcoin.it/wiki/Difficulty), which reduces to a number of hashes-per-satoshi ([example formula](http://bitcoin.stackexchange.com/questions/12013/how-many-hashes-create-one-bitcoin/12030#12030).  Currently, the difficulty of [40007470271.271](https://bitcoinwisdom.com/bitcoin/difficulty) results in  
* alice gets the current blockchain difficulty and generates lots of p2hh's with secrets of the current difficulty of the btc in them
* alice puts them all in a "budget" tx to bob's pubkey
* bob verifies and does same back in reverse, is “change” tx
* alice or bob can claim either tx anytime, but will cost high fees
* either can brute force any p2hh but claiming them may impose more fees, and "costs" the same to brute force (no incentive)
* each micro-tx involves bob and alice randomly picking a p2hh in the txns and exchanging the secret, verifying its difficulty matches (ending if not)
* anytime, either can send/require a “re-balance” of original tx with the current value unlocked in one output and fewer p2hh's, minimizes fees for both 
