# Bitcoin  Penny Banks - Distributed Microtransactions

## Abstract

The architecture of the bitcoin blockchain does not support microtransactions without fees in order to reward the network for storing the ledger, small transactions are simply not economically valuable enough to maintain in a distributed blockchain.

This outlines a simple technique to turn a larger bitcoin value into miniscule amounts that can be individually transferred between any two parties without requiring trust or timelocks, and while minimizing the potential for fees and "dust" transactions.  It shows how to create a temporary side-ledger to use for exchanging the microtransactions based on the same proof-of-work mining value of the bitcoin blockchain.

## Motivation

With the rules for accepted P2SH opcodes relaxing [in 0.10](https://github.com/bitcoin/bitcoin/pull/4365), new types of scripts can be used in transactions and will accepted into the blockchain by updated miners.  While many opcodes are still [diabled](https://en.bitcoin.it/wiki/Script#Words) to minimize the risk of a hard fork, only an `[OP_HASH256](https://en.bitcoin.it/wiki/Script#Crypto)` is required to enable proof-of-work based micro-transactions.

The existing [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party) technique works within the current limits and has had some early adoption, but it can now be significantly simplified and aligned with the core value structure of the blockchain, proof-of-work based hashing. The proposed [zero-knowledge contingent payment](https://en.bitcoin.it/wiki/Zero_Knowledge_Contingent_Payment) is also a good foundation, but instead of an external protocol the contingency function is included here as part of the transaction itself.

## Specification

In order to perform micro-transactions two parties must first establish that a larger value is guaranteed to be available to fund the smaller exchanges.  This larger transaction includes a proof-of-work for the value it contains and acts as the "bank" that is only ever broadcast to the network once to minimize the overhead fees.  The individual micro-transactions are private and not broadcast, they are instead accounted for between the two parties as reducing the proof-of-work in the bank transaction.

### Pay-to-Hash (P2H*)

A `P2H*` is only accepted in a transaction when used as a [P2SH](https://en.bitcoin.it/wiki/Pay_to_script_hash) from another transaction in version [0.10 or later](https://github.com/bitcoin/bitcoin/pull/4365).

The template looks like:
```
scriptPubKey: OP_HASH256 <checkHash> OP_EQUALVERIFY
scriptSig: <data>
```
This allows anyone with the correct `<data>` to spend it, you may recognize the pattern from the [transaction puzzle example](https://en.bitcoin.it/wiki/Script#Transaction_puzzle).  These types of transactions can now be commonly used to anonymously exchange value based on any simple shared or derived secret, as well as act as the foundation for a proof-of-work when the size of the `data` is fixed/known or can be drived from an agreed upon proof-of-work chain.

A `P2H*` one or more sequential `OP_HASH256 <checkHash> OP_EQUALVERIFY` sectons to validate each individual `<data>` input, allowing single or multi-party secret sharing. The shorthand for this type of script is numbered based on the quantity of `<checkHash>` included, one is a `P2H1` and two a `P2H2`, etc.


### Penny Banks (PB)

A Penny Pank (`PB`) is created by generating a series of small proof-of-work challenges that divide an amount of bitcoin into smaller values to be individually exchanged.  Each challenge in the set has a secret bitstring with a size calculated such that the value it represents matches [current block difficulty](#difficulty) in number of hashes required to generate a given SHA-256 hash. The resulting series of hashes collectively represent a larger bitcoin value as a set of smaller proof-of-works equal to the bitcoin itself.

For two parties to mutually agree on a `PB` they must each provide and verify a set of challeges that equal in total difficulty, and together these two sets form the foundation for a `PB` transaction

This transaction uses a `P2H2` as one of the `P2SH` outputs for the main balance available in the `PB`, and a `P2PKH` for each of the parties to carry forward the balance not associated with the bank.  Like [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party), this transaction is kept private between the two parties and only used as a last resort if either party misbehaves.  The un-broadcast transaction can then be updated and "re-balanced" over time as value is exchanged, adjusting the amounts of the outputs and generating new signatures.

In order to guarantee a `PB` is funded without being broadcast, a `P2SH` specifying the `PB` as the output is broadcast and validated with a [2-of-2 multisig](https://bitcoin.org/en/developer-guide#multisig) so that both parties must agree upon and sign the outputs in order to use the full transaction as-is at any point. When either party wants to settle and close the `PB`, the balances are updated and the `P2H2` is removed so that just normal outputs remain.


<a name="difficulty" />
#### proof-of-work Difficulty

The value of every bitcoin is backed by the current [difficulty](https://en.bitcoin.it/wiki/Difficulty), which reduces to a number of hashes-per-satoshi ([example formula](http://bitcoin.stackexchange.com/questions/12013/how-many-hashes-create-one-bitcoin/12030#12030).  Currently, the difficulty of [40007470271.271](https://bitcoinwisdom.com/bitcoin/difficulty) is based on the rate of 270,591,326 GH/s, which results in approximately [65 GH](https://www.google.com/#q=((270%2C591%2C326+*+60+*+10)+%2F+25)+%2F+100%2C000%2C000) to back the value of one satoshi.  A proof-of-work for one satoshi would then use approximately [36 bits](http://www.wolframalpha.com/input/?i=log_2%28%28%28270%2C591%2C326%2C000%2C000%2C000+*+60+*+10%29+%2F+25%29+%2F+100%2C000%2C000%29), where a random bitstring of that size when hashed would require an average of 65 billion hashes of the same size bitstring to find a match.

#### Private Penny Banks (Agreeing on a `P2H2`)

> documentation here is a higher level work in progress, detailed transaction examples forthcoming

When Alice wants to perform microtransactions with Bob, they begin by creating multiple sets of small proof-of-work challenges by calculating the current hashes-per-satoshi and generating an array of random bitstrings of the appropriate size to divide a larger value into the individual small values per transaction.  The number of bitstrings in a set, the size of each individual bitstring, and the total number of sets created may vary by application. (TODO: design one or more standard defaults for these that cover most use cases)

Alice then creates the sets of their hashes as well the double-hashes of each complete set and sends Bob all of the identically-sized sets to choose from.  Bob can then randomly select one of them and challenge Alice to reveal the source secret bitstrings of all of the other sets in order to validate that they are all sized and calculated correctly (a partial/confidence-based [zero-knowledge proof](http://en.wikipedia.org/wiki/Zero-knowledge_proof) of the difficulty).  Once Bob has validated and selected a set from Alice, they perform the same process in reverse with matching sets to have Alice choose/validate a set as well.

At this point both Alice and Bob have a list of small proof-of-works that add up to a larger bitcoin value and can create a `PB` transaction.  The required `P2H2` is generated using both of the double-hashes of the selected sets, one from Alice and one from Bob.  This requires that all of the secrets must be known from both sets in order to generate the correct data input claim the balance assigned to the `P2H2`, neither party has access to this output without doing the amount of work to derive the secrets for it.

Once both of them exchange their signatures of the agreed upon `PB`, then Alice creates and broadcasts a normal `P2SH` transaction to fund it which Bob can validate like any normal bitcoin transaction.  The value is then locked and inaccessible to either without cooperation or work.

As Alice and Bob exchange the actual small asset/values in a microtransaction they can also exchange the secret bitstrings from their sets for the correct value and validate it. At regular intervals either side may request a re-balance, exchanging and signing an updated `PB` with the balances of the `P2H2` and `P2PKH` outputs adjusted accordingly.

This model incentivises both parties to cooperate to mutually unlock the value over time.  The bitcoin in the bank is locked and inaccessible to either side without cooperation or hashing, and since the difficulty is identical to mining the main blockchain it is of no current value to withold or abandon the exchange.

If either party misbehaves or stops providing value, the other has a valid `PB` to broadcast to permanently freeze the exchange at that point.  If the source set of secret bitstrings is stored by both, at any point in the future the two parties may begin cooperating again by exchanging them and using the frozen `P2H2` as the input.  Either side may also decide at some point in the future to perform the remaining hashing work to derive the correct hashes and claim the `P2H2` value, but this process may offer little reward given the value of hashing for the main blockchain, the frozen `PB` transactions act as a long term mutual debt/asset for both parties, owned by neither.

The `PB` transactions may include additional inputs and outputs (such as `OP_RETURN`) to include custom requirements or involve additional parties for arbitration, and the `P2H*` outputs may be customized as needed for different applications.

Summary steps:

* Alice->Bob offer sets of small challenges
* Bob->Alice choose and verify a set of challenges and offer sets in return
* Alice->Bob choose and verify a set, create and sign a PB and send to Bob
* Bob->Alice return signed PB
* Alice broadcasts funding of PB
* Bob verifies funding, value is now locked in the PB
* over time PB is re-balacnced with new signatures, either can broadcast it and freeze it at that point locking the balances in place


#### Penny Bankers

> work in progress

Anyone can create a pair of Penny Banks with one or more well-known "Penny Bankers", one for credits and one for debits.  These `PBs` can then be used as a method to perform small microtransactions with any third party without requiring a `PB` for each third party, minimizing the risk and amount of bitcoin locked in any `PB`.  The "Banker" will manage the pair of PBs in order to be available to clear microtransactions with the third party or the third party's banker.

When initiating an exchange with a third party, the sender must share the current `PB` set of hashes to act as the "account" and the Banker the `PB` is with so that the third party can validate that it is valid and currently funded.

The recipient must also have a `PB` with either the same Banker or with a Banker that will clear values with the sender's. Each secret bitstring received as a microtransaction can then be validated immediately locally as part of the `PB` and of the right difficulty, and should then be exchanged with their Banker into their private receiving `PB`.  Exchanging these offline is possible but runs the risk of the individual secret bitstring becoming invalid since the time delay between receiving and clearing is a window for the sender to double-spend them. 

Using multiple Bankers who independently clear with each other helps minimize the visibility of the actual parties performing the microtransactions.

