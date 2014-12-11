# Bitcoin  Penny Banks - Distributed Microtransactions

## Abstract

The architecture of the bitcoin blockchain does not support microtransactions without fees in order to reward the network for maintaining the ledger, small transactions are simply not economically valuable enough to maintain in a distributed blockchain.

This defines a simple technique to turn a larger bitcoin value into miniscule amounts that can be individually transferred between any two parties without requiring trust or timelocks while minimizing the potential for fees and "dust" transactions.  It shows how to create a side-ledger to use for exchanging the microtransactions based on the same proof-of-work mining value of bitcoin itself.

## Motivation

With the rules for accepted P2SH opcodes relaxing [in 0.10](https://github.com/bitcoin/bitcoin/pull/4365), new types of scripts can be used in transactions and will accepted into the blockchain by updated miners.  While many opcodes are still diabled to minimize the risk of a hard fork, only an `OP_HASH256` is required to enable micro-transactions.

The current [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party) technique works within the current limits and has had some early adoption, but it can now be significantly simplified and aligned with the core value structure of the blockchain, proof-of-work based hashing. The proposed [zero-knowledge contingent payment](https://en.bitcoin.it/wiki/Zero_Knowledge_Contingent_Payment) is also very similar, but instead of an external protocol the contingency function is included as part of the transaction itself.

## Specification


### Pay-to-Hash (P2H)

A `P2H` is only accepted in a transaction when used as a [P2SH](https://en.bitcoin.it/wiki/Pay_to_script_hash) from another transaction in version [0.10 or later](https://github.com/bitcoin/bitcoin/pull/4365).

```
scriptPubKey: OP_HASH256 <checkHash> OP_EQUALVERIFY
scriptSig: <data>
```
This allows anyone with the correct `<data>` to spend it, you may recognize the pattern from the [transaction puzzle example](https://en.bitcoin.it/wiki/Script#Transaction_puzzle).  These types of transactions can now be commonly used to anonymously exchange value based on any shared or derived secret, as well as act as the foundation for a proof-of-work when the size of the `data` is fixed/known or can be drived from an agreed upon proof-of-work chain.

A P2H may have multiple sequential `OP_HASH256 <checkHash> OP_EQUALVERIFY` to validate multiple individual `<data>` inputs, allowing multi-party secret sharing. 


### Penny Banks (PB)

A `penny bank` is created by generating a series of small proof-of-work challenges (the `pennies`) that equally divide an amount of bitcoin into smaller values that can be individually exchanged.  Each challenge has a secret bitstring with a size calculated such that the value it represents matches current block difficulty in number of hashes required to generate a given SHA-256 hash. The resulting series of hashes collectively represent a larger bitcoin value as a set of smaller proof of works equal to the bitcoin itself.

The penny bank transaction (PB) uses a P2H as one P2SH outputs that carries the main balance of pennies available and a P2PKH for each of the parties to carry forward the balance not associated with the pennies.  Like [micropayment channels](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party), this transaction is kept private between the two parties and only used as a last resort if either party misbehaves.  The transaction can then be updated and "re-balanced" as pennies are exchanged, adjusting the values of the outputs and generating new signatures.

In order to guarantee a PB is funded, a P2SH is broadcast and validated with a 2-of-2 multisig so that both parties must agree upon and sign the current PB outputs in order to use the full transaction as-is at any point. When either party wants to settle and close the PB, the balances are updated and the P2H is removed so that just normal outputs remain.


#### Proof of Work Difficulty

The value of every bitcoin is backed by the current [difficulty](https://en.bitcoin.it/wiki/Difficulty), which reduces to a number of hashes-per-satoshi ([example formula](http://bitcoin.stackexchange.com/questions/12013/how-many-hashes-create-one-bitcoin/12030#12030).  Currently, the difficulty of [40007470271.271](https://bitcoinwisdom.com/bitcoin/difficulty) results in approximately [65 hashes](https://www.google.com/#q=((270%2C591%2C326+*+60+*+10)+%2F+25)+%2F+100%2C000%2C000) to back the value of one satoshi.  A proof of work for one satoshi would then require between 6 and 7 bits, where a random bitstring of that size when hashed would require an average of 65 hashes of the same size bitstring to find a match.

#### Private Penny Banks (Agreeing on a P2H)

> documentation here is a higher level work in progress

When Alice wants to perform microtransactions with Bob, they begin by creating sets of "half pennies" by calculating the current hashes-per-satoshi and generating an array of random bitstrings of the appropriate size for each penny's value.

Alice then creates the sets of their hashes as well the double-hashes of each set, and sends Bob a large number of identically sized sets to choose from.  Bob can then randomly select one of them and challenge Alice to reveal the sets of secrets for the rest in order to validate that they are all sized and calculated correctly (a partial/confidence-based [zero-knowledge proof](http://en.wikipedia.org/wiki/Zero-knowledge_proof) of the difficulty). Once Bob has validated the half-pennies, they perform the same process in reverse to have Alice choose/validate a set, and together a secret from each of them represents one penny.

At this point both Alice and Bob have an equal list of small proof-of-works that add up to a larger bitcoin value and can create a PB transaction.  A P2H is generated using both of the double-hashes of the secret sets, one from Alice and one from Bob, so that all of the secrets must be known from both to generate the correct data input to claim the P2H.  Once both of them exchange their signatures of the agreed upon PB, then Alice creates a transaction to fund this PB and broadcasts it, so that the value is locked and can be verified by Bob before beginning any microtransactions.

As Alice and Bob exchange the actual small asset/values represented by a penny they also exchange the secret data for each side of that penny and validate it. At regular intervals either side may request a re-balance, exchanging and signing an updated PB with the balances of the P2H and P2PKHs adjusted.  

Need to expand yet on these redundant points:

* provides a way to prove the value is locked/available and each penny verifiably exchanges that amount of value (reducing the work to unlock the remainder)
* the incentive is always to cooperate since mining the remainder in the P2H is costly
* alice must be willing to lock value in the pennies but only after successful validation exchanges with bob
* neither party has any incentive to abandon the PB or try to mine the balance, but either may do so as a last resort
* since the brute force of a proof-of-work P2HH requires as many hashes as mining, there is no incentive to crack them
* if either side abandons or broadcasts a partial PB transaction, the P2H balance remains as an asset that will likely increase in value
* the PB transactions can involve additional parties to add arbitration, lock to sidechains, include OP_RETURNs, etc

Summary steps:

* Alice->Bob offer sets of half-pennies
* Bob->Alice choose and verify a set of half-pennies and offer sets in return
* Alice->Bob choose and verify a set, create and sign a PB and send to Bob
* Bob->Alice return signed PB
* Alice broadcasts funding of PB
* Bob verifies funding, value is now locked in the PB
* over time PB is re-balacnced with new SIGs, either can broadcast it and freeze it at that point locking the balances in place


#### Penny Bankers

> work in progress, brainstorming

Anyone can create a pair of Penny Banks with one or more well-known Penny Bankers and then use them as a method to send individual pennies and perform small microtransactions with any third party.  The Banker will manage the pair of PBs, one as a source of pennies, and another to receive pennies, and new ones can be created as needed.  The valid/current source PB must be shared with the third party who can validate that it is funded by the blockchain and signed by the Banker, and also validate its current status with the Banker before accepting pennies from it.

The recipient must also have a PB with either the same Banker or with a Banker that will clear pennies with the sender's. Each penny received can then be validated immediately locally as part of the PB, and should then be exchanged with their Banker into their private receiving PB.  Exchanging pennies offline is possible but runs the risk of them becoming invalid since the time delay between receiving and clearing is a window for the sender to double-spend them. 

A shared Banker is aware of both the source and destination PBs only while they are valid and exchanging pennies, using multiple Bankers who independently clear with each other helps minimize the visibility of those transactions.

