# Bitcoin Microtransaction Smart Contracts

> This is a work-in-progress, once test implementations are interoperating this document will be reorganized and cleaned up, feedback is still encouraged even in this state

## Abstract

The architecture of the bitcoin blockchain does not support microtransactions without fees in order to reward the network for storing the ledger, small transactions are simply not economically valuable enough to maintain in a distributed blockchain.

This outlines a simple technique to create a smart contract that puts a larger bitcoin value in mutual escrow between two parties, such that miniscule amounts of that value can be transacted without requiring additional trust, timelocks, oracles, or other third parties, and while minimizing the potential for fees and "dust" transactions.  It shows how to create a temporary side-ledger to use for exchanging the microtransactions based on the same proof-of-work mining value of the bitcoin blockchain.

## Motivation

With the rules for accepted P2SH opcodes relaxing [in 0.10](https://github.com/bitcoin/bitcoin/blob/0.10/doc/release-notes.md#standard-script-rules-relaxed-for-p2sh-addresses), new types of scripts can be used in transactions and will accepted into the blockchain by updated miners.  While many opcodes are still [disabled](https://en.bitcoin.it/wiki/Script#Words) to minimize the risk of a hard fork, only a common `[OP_HASH160](https://en.bitcoin.it/wiki/Script#Crypto)` is required to enable proof-of-work based micro-transactions.

The existing [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party) technique works within the current limits and has had some early adoption, but it can now be significantly simplified and aligned with the core value structure of the blockchain, proof-of-work based hashing. The proposed [zero-knowledge contingent payment](https://en.bitcoin.it/wiki/Zero_Knowledge_Contingent_Payment) is also a good foundation, but instead of an external protocol the contingency function is included here as part of the transaction itself.

There is also some similarities to the [sidechains paper](http://www.blockstream.com/sidechains.pdf) in that this proposal also has the properties of trustlessness (not relying on external parties) and uses lists of hashes to verify proof-of-work, but the scope is limited to acting as a simple transient side-ledger versus a two-way pegged full sidechain.

## Model

A "penny bank" is a mechanism for placing some amount of bitcoin on hold between two parties without involving another third party, such that those two parties can then exchange smaller amounts of value over time independently.  This requires that one or both parties be willing to source that amount of value and have it locked between them, so that only through cooperation can it be unlocked again.

The penny bank acts as a simple mechanical escrow, where the funds are guaranteed to be available to the two parties, but only they can mutually agree to further release funds.  If either party stops cooperating or misbehaves, the funds at that point remain locked until cooperation begins again.

While in many common microtransaction scenarios there is some amount of trust or reputation with one of the parties so that having funds locked indefinitely is not a large concern, when there is limited trust then the locked value should start as a small value to reduce the risk, the only side-effect being a larger percentage of fees on the transaction to fund it.

This proposal also currently focuses only on the core locking mechanism and exchanges, it is possible to add timelocks and create more complex transactions that further reduce the risk of funds remaining locked.

## Specification

In order to perform micro-transactions two parties must first establish that a larger value is guaranteed to be available to fund the smaller exchanges with a verifiable proof-of-work.  This larger transaction is private to both parties while transacting and acts as the "bank", it is only ever broadcast to the network at the end or whenever either party is finished.  The individual micro-transactions are always private and not broadcast, they are instead accounted for between the two parties as reducing the proof-of-work referenced in the bank transaction.

### P2SH Conditional Multisig (P2CM)

> A *Conditional Multisig* script is only accepted as a [P2SH](https://en.bitcoin.it/wiki/Pay_to_script_hash) in version [0.10 or later](https://github.com/bitcoin/bitcoin/blob/0.10/doc/release-notes.md#standard-script-rules-relaxed-for-p2sh-addresses).

The conditional multisig script template used here is:
```
OP_HASH160 <A hash> OP_EQUALVERIFY OP_HASH160 <B hash> OP_EQUALVERIFY <OP_1> <A pubkey> <B pubkey> <OP_2> <OP_CHECKMULTISIG>
```

A valid scriptSig requires three data pushes, one for each of the two `OP_HASH160` as the source data (the secrets) to generate a match for the given hash, and one signature from A or B to ensure nobody else can claim the value with the secret data alone.

### Penny Bank (PB)

A Penny Bank (abbreviated `PB`) is the shared state between two parties that have agreed to exchange microtransactions pinned to the blockchain through a single larger transaction.

The PB is created by first generating a series of small proof-of-work challenges that divide an amount of bitcoin into smaller values to be individually exchanged.  Each challenge in the series has a secret bitstring with a size calculated such that the value it represents matches [current block difficulty](#difficulty) in number of hashes required to generate a given SHA-256 hash. The resulting series of hashes collectively represent the total PB value as a set of smaller proof-of-works equal to the bitcoin itself (it would require as many hashes to do these proofs as it would be to mine new bitcoin of that value).

For two parties to mutually agree on a `PB` they must each provide and verify a set of challenges that equal in total difficulty, and together these two sets form the foundation for a `P2CM` that holds/locks the total value. A private [2-of-2 multisig](https://bitcoin.org/en/developer-guide#multisig) input `PB` transaction is then created that sends the main balance available to the `P2CM` (as a P2SH) output, and includes a `P2PKH` for each of the parties to carry forward the balances not being used for or already exchanged in microtransactions.

Like [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party), this main `PB` transaction is kept private between the two parties and only used as a last resort if either party misbehaves.  The un-broadcast transaction can then be updated and "re-balanced" over time as value is exchanged, adjusting the amounts of the outputs and generating new signatures.

In order to guarantee a `PB` is funded without being broadcast, a `P2SH` specifying it as the output is broadcast and validated before beginning any microtransactions.  This `P2SH` source transaction may from either party, or may be created jointly by both parties so that neither is taking the risk alone by locking only their value.  (TODO: document different common microtransaction patterns that use either/both funding models)

When either party wants to settle and close the `PB`, the balances are updated and the `P2CM` is removed so that just normal outputs remain.  As a last resort, either party may broadcast the last signed transaction which will freeze the `PB` at that point and the value remaining sent to the `P2CM` will be locked until either party either does the proof-of-works or they begin cooperating again.


<a name="difficulty" />
#### proof-of-work Difficulty

The value of every bitcoin is backed by the current [difficulty](https://en.bitcoin.it/wiki/Difficulty), which reduces to a number of hashes-per-satoshi ([example formula](http://bitcoin.stackexchange.com/questions/12013/how-many-hashes-create-one-bitcoin/12030#12030).  Currently, the difficulty of [40007470271.271](https://bitcoinwisdom.com/bitcoin/difficulty) is based on the rate of 270,591,326 GH/s, which results in approximately [65 GH](https://www.google.com/#q=((270%2C591%2C326+*+60+*+10)+%2F+25)+%2F+100%2C000%2C000) to back the value of one satoshi.  A proof-of-work for one satoshi would then use approximately [36 bits](http://www.wolframalpha.com/input/?i=log_2%28%28%28270%2C591%2C326%2C000%2C000%2C000+*+60+*+10%29+%2F+25%29+%2F+100%2C000%2C000%29), where a random bitstring of that size when hashed would require an average of 65 billion hashes of the same size bitstring to find a match.

#### Private Penny Banks

> documentation here is a higher level work in progress, detailed transaction examples forthcoming

When Alice wants to perform microtransactions with Bob, they begin by creating multiple sets of small proof-of-work challenges by calculating the current hashes-per-satoshi and generating an array of random bitstrings of the appropriate size to divide a larger value into the individual small values per transaction.  The number of bitstrings in a set, the size of each individual bitstring, and the total number of sets created may vary by application. (TODO: design one or more standard defaults for these that cover most use cases)

One example set:
```json
{
  "challenges":["0b14..","71cf..",...], // sha256's of each secret
  "secrets":["ae29..","b388..",...],
  "hash160":"6c05.." // the ripemd160(sha256(secrets))
}
```

Alice then creates the sets of their hashes as well the final `ripemd160(sha256([set]))` of each complete set and sends Bob just the challenges and final hash of all of the identically-sized sets.  Bob can then randomly select one of them and challenges Alice to reveal the source secret bitstrings of all of the other sets in order to validate that they are all sized and calculated correctly (a partial/confidence-based [zero-knowledge proof](http://en.wikipedia.org/wiki/Zero-knowledge_proof) of the difficulty).  Once Bob has validated and selected a set from Alice, they perform the same process in reverse with matching sets to have Alice choose/validate a set as well.

At this point both Alice and Bob have a list of small proof-of-works that add up to a larger bitcoin value and can create a `P2CM` transaction.  The required conditional multisig script is generated using both of the hashes of the selected sets, one from Alice and one from Bob.  This requires that all of the secrets must be known from both sets in order to generate the correct data input claim the balance assigned to the `P2SH`, neither party has access to this output without doing the amount of work to derive the secrets for it.

Once both of them exchange their signatures of the agreed upon `PB` transaction, then Alice creates and broadcasts a normal `P2SH` to fund it which Bob can validate like any normal bitcoin transaction.  The value is then locked and inaccessible to either without cooperation or work.

As Alice and Bob exchange the actual small asset/values in a microtransaction they can also exchange the secret bitstrings from their sets for the correct value and validate it. At regular intervals either side may request a re-balance, exchanging and signing an updated `PB` with the balances of the `P2CM` and `P2PKH` outputs adjusted accordingly.

This model incentivises both parties to cooperate to mutually unlock the value over time.  The bitcoin in the bank is locked and inaccessible to either side without cooperation or hashing, and since the difficulty is identical to mining the main blockchain it is of no current value to withhold or abandon the exchange.

If either party misbehaves or stops providing value, the other has a valid transaction to broadcast to permanently freeze the exchange at that point.  If the source set of secret bitstrings is stored by both, at any point in the future the two parties may begin cooperating again by exchanging them and using the frozen `P2CM` as the input.  Either side may also decide at some point in the future to perform the remaining hashing work to derive the correct hashes and claim the `P2CM` value themselves, but this process may offer little reward given the value of hashing for the main blockchain, the frozen transactions act as a long term mutual debt/asset for both parties, owned by neither.

Summary steps:

* Alice->Bob offer sets of small challenges
* Bob->Alice choose and verify a set of challenges and offer sets in return
* Alice->Bob choose and verify a set, create and sign a PB and send to Bob
* Bob->Alice return signed PB
* Alice broadcasts funding of PB
* Bob verifies funding, value is now locked in the PB
* over time PB is re-balanced with new signatures, either can broadcast it and freeze it at that point locking the balances in place


#### Penny Bankers

> TODO: work in progress, this is where microtransactions can get really interesting

Anyone can create a pair of Penny Banks with one or more well-known "Penny Bankers", one for credits and one for debits.  These `PBs` can then be used as a method to perform small microtransactions with any third party without requiring a `PB` for each third party, minimizing the risk and amount of bitcoin locked in any `PB`.  The "Banker" will manage the pair of PBs in order to be available to clear microtransactions with the third party or the third party's banker.

When initiating an exchange with a third party, the sender must share the current `PB` set of hashes to act as the "account" and the Banker the `PB` is with so that the third party can validate that it is valid and currently funded.

The recipient must also have a `PB` with either the same Banker or with a Banker that will clear values with the sender's. Each secret bitstring received as a microtransaction can then be validated immediately locally as part of the `PB` and of the right difficulty, and should then be exchanged with their Banker into their private receiving `PB`.  Exchanging these offline is possible but runs the risk of the individual secret bitstring becoming invalid since the time delay between receiving and clearing is a window for the sender to double-spend them.

Using multiple Bankers who independently clear with each other helps minimize the visibility of the actual parties performing the microtransactions.

