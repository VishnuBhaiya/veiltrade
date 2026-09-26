# VeilTrade Judge Q&A

## “Is the current MVP fully private on-chain?”
No. We deliberately separate the functional settlement MVP from the full shielded design. `VeilSettlement.sol` proves the HSK atomic DvP/compliance path but standard ERC-20 calldata is public. Full post-trade confidentiality uses `ConfidentialSettlement.sol` plus the generated Noir verifier, commitments and nullifiers. We do not call `DemoVerifier.sol` cryptographic security.

## “Then what privacy works today?”
Pre-trade institution identity is removed from the public market view, public APIs expose commitments instead of counterparties, matched disclosure data is encrypted and access-controlled, and the shielded-note contract/circuit interface is implemented for the next step.

## “Why blockchain instead of a normal private exchange database?”
A normal private database can hide data, but every counterparty must trust the operator for final settlement. VeilTrade uses HSK for shared state, participant-controlled wallet approvals and atomic DvP: both legs move or the entire transaction reverts.

## “Why HSK specifically?”
HSK is EVM compatible and explicitly provides an institutional/RWA-oriented stack. VeilTrade integrates HSK testnet settlement and includes an adapter for HSK’s documented KYC SBT `isHuman()` interface.

## “Can the matcher cheat?”
The matcher can propose a match, but it cannot settle funds by itself. The buyer and seller approve the on-chain trade instruction and token allowances. The commitment binds the off-chain match record. In the full ZK version, the proof also binds hidden note values and nullifiers.

## “What if one party walks away?”
Nothing settles. There is no credit/default risk in the DvP core. Both parties must approve; if a condition fails, the HSK transaction reverts and neither leg transfers.

## “What if KYC is revoked after the order was created?”
`VeilSettlement` re-checks both parties’ eligibility immediately before settlement, so an old approved order cannot bypass a later compliance revocation.

## “Why is the matching engine off-chain?”
Order matching is search/sort computation and does not need blockchain consensus. Keeping matching off-chain reduces latency and gas. HSK is used where trust minimization matters: eligibility, approvals, execution and atomic settlement.

## “Who can see the trade?”
The standard application view is redacted. The regulator console demonstrates authorized selective disclosure. The MVP uses encrypted metadata plus an authorization key; production would use institutional key management and cryptographic view keys with audited access.

## “Why not just use a permissioned blockchain?”
A permissioned chain can provide confidentiality but gives up some public-chain verifiability and ecosystem composability. VeilTrade explores a hybrid: public HSK settlement/proof state with private commercial data and controlled disclosure.

## “What makes this more than a UI?”
The repository includes the matching engine, persistence schema, signed wallet login, encryption/commitments, regulator access, Solidity eligibility registry, atomic DvP, HSK KYC adapter, shielded commitment/nullifier contract, Noir circuit scaffold, deployment scripts and contract tests.
