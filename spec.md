# Bitcoin Microtransaction Smart Contracts

> This is a work-in-progress, once test implementations are interoperating this document will be reorganized and cleaned up, feedback is still encouraged even in this state

## Abstract

The architecture of the bitcoin blockchain requires [fees on every transaction](https://en.bitcoin.it/wiki/Transaction_fees) in order to reward the network for storing the ledger, small microtransactions are simply [not economically valuable](http://www.coindesk.com/new-study-low-bitcoin-transaction-fees-unsustainable/) enough to maintain in a distributed blockchain.

This outlines a simple technique to create a smart contract that puts a larger bitcoin value in mutual escrow between two parties, such that miniscule amounts of that escrow value can be transacted without requiring additional trust, timelocks, oracles, or other third parties, and while minimizing the potential for fees and "dust" transactions.  It shows how to create a temporary side-ledger to use for exchanging the microtransactions based on the same proof-of-work mining value of the bitcoin blockchain.

## Motivation

With the rules for accepted P2SH opcodes relaxing [in 0.10](https://github.com/bitcoin/bitcoin/blob/0.10/doc/release-notes.md#standard-script-rules-relaxed-for-p2sh-addresses), new types of scripts can be used in transactions and will accepted into the blockchain by updated miners.  While many opcodes are still [disabled](https://en.bitcoin.it/wiki/Script#Words) to minimize the risk of a hard fork, only a common `[OP_HASH160](https://en.bitcoin.it/wiki/Script#Crypto)` is required to enable proof-of-work based microtransaction smart contracts.

The existing [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party) technique demonstrates how to modify a private transaction but requires a trust model based on timelocks and access to update signatures per value exchange, which is not ideal in many microtransaction situations. The proposed [zero-knowledge contingent payment](https://en.bitcoin.it/wiki/Zero_Knowledge_Contingent_Payment) is also a good foundation, but instead of an external protocol the contingency function is included here as part of the transaction itself.

There is also some similarities to the [sidechains paper](http://www.blockstream.com/sidechains.pdf) in that this proposal has the properties of trustlessness (not relying on external parties) and uses lists of hashes to verify proof-of-work, but the scope is limited to acting as a simple transient side-ledger versus a two-way pegged full sidechain.

## Model

A "penny bank" is a mechanism for placing some amount of bitcoin on hold between two parties without involving another third party, such that those two parties can then exchange smaller amounts of value over time independently.  This requires that one or both parties be willing to source that amount of value and have it locked in an escrow between them, so that only through cooperation can it be unlocked again.

The penny bank creation process negotiates a simple escrow where the funds are guaranteed to be available to the two parties, but only they can mutually agree to release any funds.  If either party stops cooperating or misbehaves, the funds at that point remain frozen until cooperation begins again or the remaining proof of work is performed.

In many common microtransaction scenarios there is some amount of prior trust or reputation with one of the parties (such as service providers), so having funds locked in an escrow is not a large concern.  When there is limited or no trust then the locked value should start very small to reduce the risk, the only side-effect being a larger percentage of fees on the transaction to fund it.

This proposal also only currently focuses on the core locking mechanism and exchanges, it is possible to add timelocks and create more complex transactions that further reduce the risk of funds remaining locked.

## Specification

In order to perform micro-transactions two parties must first establish that a larger value is guaranteed to be available to fund the smaller exchanges with a verifiable proof-of-work.  This larger transaction is private to both parties while transacting and acts as the "bank", it is only ever broadcast to the network at the end or whenever either party is finished.  The individual micro-transactions are always private and not broadcast, they are instead accounted for between the two parties as reducing the proof-of-work referenced in the bank transaction.

### Pay to Script Hash Conditional Multisig (P2CM)

> A *Conditional Multisig* script is only accepted as a [P2SH](https://en.bitcoin.it/wiki/Pay_to_script_hash) in version [0.10 or later](https://github.com/bitcoin/bitcoin/blob/0.10/doc/release-notes.md#standard-script-rules-relaxed-for-p2sh-addresses).

The conditional multisig script template used here is:
```
OP_HASH160 <A hash> OP_EQUALVERIFY OP_HASH160 <B hash> OP_EQUALVERIFY <OP_1> <A pubkey> <B pubkey> <OP_2> <OP_CHECKMULTISIG>
```

A valid scriptSig requires three data pushes, one for each of the two `OP_HASH160` as the source data (the secrets) to generate a match for the given hash, and one signature from A or B to ensure nobody else can claim the value with the secret data alone.

### Penny Bank (PB)

A Penny Bank (abbreviated `PB`) is the shared state between two parties that have agreed to exchange microtransactions pinned to the blockchain through a single larger transaction.

The `PB` contains many small proof-of-work challenges (the pennies) that are created in an ordered sequence called a `pence`.  Each penny is an 8 byte value, 3 bytes of the sequence number (big endian) and a 5-byte secret.  A `pence` is a 32 byte random nonce and a sequence of pennies that are created by performing a SHA-256 digest of the nonce XOR'd with previous penny in the sequence.  The first penny is `p0` (sequence 0) and its secret is the random seed of the `pence`, with each sequentially increasing penny's secrets being the first 5 bytes of the previous one's digest output.  Given any penny, all higher sequences can be immediately calculated, but lower ones could only be derived through brute force hashing.

The number of pennies in a `pence` must represent a [difficulty](#value) *equal to or greater than the total `PB` bitcoin value*, it must require at least as many hashes to do these proofs as it would be to mine new bitcoin of that value.

For two parties to mutually agree on a `PB` they must each provide and verify a `pence` that equal in total difficulty, and together these form the foundation for a `P2CM` that holds/locks the total value.  The private source data that locks the `P2CM` is the result of performing a SHA-256 digest on each penny sequentially: `sha256(sha256(sha256(sha256(p0),p1),p2),pN)`, this "pence digest" can only be generated by knowing the `p0`.

A private [2-of-2 multisig](https://bitcoin.org/en/developer-guide#multisig) input `PB` transaction is then created that sends the main balance available to the `P2CM` (as a P2SH) output, and includes a `P2PKH` for each of the parties to carry forward the balances not being used for or already exchanged in microtransactions.

Similar to [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party), this primary transaction is kept private between the two parties and only used as a last resort if either party misbehaves.  The un-broadcast transaction can also be updated and "re-balanced" over time as value is exchanged, adjusting the amounts of the outputs and generating new signatures.

In order to guarantee a `PB` is funded without being broadcast, a `P2SH` specifying it as the output is broadcast and validated before exchanging any microtransactions.  

When either party wants to settle and close the `PB`, the balances are updated and the `P2CM` is removed so that just normal outputs remain.  As a last resort, either party may broadcast the last signed transaction which will freeze the `PB` at that point and the value remaining sent to the `P2CM` will be locked until either party either calculates the remaining pennies or they begin cooperating again.


<a name="penny" />
#### Penny Value (difficulty)

The value of every bitcoin is backed by the current [difficulty](https://en.bitcoin.it/wiki/Difficulty), which reduces to a number of hashes-per-satoshi ([example formula](http://bitcoin.stackexchange.com/questions/12013/how-many-hashes-create-one-bitcoin/12030#12030).  

Currently, the difficulty of [40007470271.271](https://bitcoinwisdom.com/bitcoin/difficulty) is based on the rate of 270,591,326 GH/s, which results in approximately [65 GH](https://www.google.com/#q=((270%2C591%2C326+*+60+*+10)+%2F+25)+%2F+100%2C000%2C000) to back the value of one satoshi.

A single penny matches the first 5 bytes of a digest, requiring up to 2^40 hashes, which would currently represent just under [17 satoshis per penny](http://www.wolframalpha.com/input/?i=%282%5E40%29%2F%28%28%28270%2C591%2C326%2C000%2C000%2C000+*+60+*+10%29+%2F+25%29+%2F+100%2C000%2C000%29) of work.  The difficulty slowly increases as computing power increases, so the hashes-per-satoshi will also go up.  Since the hashes-per-penny is currently fixed at the 5 byte size, the number of satoshis per penny will go down over time.

#### Two-Party Penny Banks

> documentation here is a higher level work in progress, detailed transaction examples forthcoming

When Alice wants to perform microtransactions with Bob, they begin by creating a set of `pence` to use for negotiating a `PB`.

A single `pence` starts with an initial random `p0` and nonce and is recursively hashed to generate the sequence to `pN`, with `N`  matching the `PB` current difficulty value.

An example set:
```json
{
  "n":1234,
  "nonce":"736711cf55ff95fa967aa980855a0ee9f7af47d6287374a8cd65e1a36171ef08",
  "pence":{
    "76a914c9f826620292b696af47ebd2013418e4e6ab6f9288ac":"b8a0eb85548d3df024db5eb8b00a089fc3d78b2c9ddef9006da7b49050c6f5b4",
    ...
  }
}
```

Each `pence` has a key of the `ripemd160(pence digest)` and the value is the `sha256(pN)` to identify the final value in the sequence.

Alice generates a set with a minimum number of `pence` and send it to Bob.  If the `N` and number of `pence` meet Bob's requirements then they select one of the pence and challenges Alice to reveal the `p0` of all of the others in order to validate that they are all sized and calculated correctly (a partial/confidence-based [zero-knowledge proof](http://en.wikipedia.org/wiki/Zero-knowledge_proof) of the difficulty).  Once Bob has validated a set and selected a single `pence` from Alice they perform the same process in reverse to have Alice choose/validate a `pence` from Bob as well.

At this point both Alice and Bob have enough knowledge to verify a sequence of small proof-of-works that verifiably add up to a larger bitcoin value and can create a `P2CM` transaction.  The required conditional multisig script is generated using both of the ripemd160 digests of the selected `pence`, one from Alice and one from Bob.

Once both Alice and Bob exchange their signatures of the agreed upon `PB` transaction, then Alice creates and broadcasts a normal `P2SH` to fund it which Bob can validate like any normal bitcoin transaction.  The value is then locked and inaccessible to either without cooperation or work.

As Alice and Bob exchange the actual small asset/values in a microtransaction they also exchange the pennies to represent that value of satoshis as a sequence difference from the last one.  A penny at any lower point in the pence can be sent to unlock the difference in value from the previous one.

If either party misbehaves or stops providing value, the other has a valid transaction to broadcast to permanently freeze the exchange at that point.  If the `pence` data is stored by both then at any point in the future the two parties may begin cooperating again by exchanging them and using the frozen `P2CM` as the input.  Either side may also decide at some point in the future to perform the remaining hashing work to derive the correct hashes and claim the `P2CM` value themselves.

Summary steps:

* Alice->Bob offer a set
* Bob->Alice choose and verify a pence from the set and offer a set in return
* Alice->Bob choose and verify a pence, create and sign a PB and send to Bob
* Bob->Alice return signed PB
* Alice broadcasts funding of PB
* Bob verifies funding, value is now locked in the PB
* either can broadcast it and freeze it at that point locking the balances in place
* when finished, the PB is rebalanced with normal outputs, signed, and broadcast


#### Multi-Party Penny Bankers

> TODO: work in progress, this is how microtransactions can scale to larger use-cases

Anyone can create a pair of Penny Banks with one or more well-known public "Penny Bankers", one for credits and one for debits.  These `PBs` can then be used as a method to perform small microtransactions with any third party without requiring a `PB` for each third party, minimizing the risk and amount of bitcoin locked in any `PB`.  The "Banker" will manage the pair of private PBs and also be available to any third party to clear microtransactions with them or their banker.

When initiating an exchange with a third party, the sender must share the identity of the Banker along with the current debit `PB` set of hashes to act as the "account" so that the third party can validate that it is valid and currently funded.

The recipient must also create/have a `PB` with either the same Banker or with a Banker that will clear values with the sender's. Each secret bitstring received as a microtransaction can then be validated immediately and locally as part of the `PB` and of the right difficulty, and should then be exchanged with their Banker into their private credit `PB`.  Exchanging these offline is possible but increases the risk of any individual secret bitstring becoming invalid since the time delay between receiving and clearing is a window for the sender to double-spend them.

Using multiple Bankers who independently clear with each other helps minimize the visibility of the actual parties performing the microtransactions.

