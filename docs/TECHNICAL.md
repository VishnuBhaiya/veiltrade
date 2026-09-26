# VeilTrade Technical Design

## 1. Product thesis

Institutional adoption of public settlement networks creates a conflict: chains need verifiable execution while institutions need confidentiality around positions, order size, timing, counterparties and commercial terms. VeilTrade is a confidential trading/settlement layer that preserves public verifiability while minimizing unnecessary information disclosure.

## 2. Functional architecture

The hackathon build deliberately has two settlement paths:

**A. Functional DvP MVP** — `VeilSettlement.sol` performs real atomic transfers of mock RWA and mock USDC on HSK Chain testnet. It is eligibility gated and counterparty approved.

**B. Shielded privacy extension** — `ConfidentialSettlement.sol` models note commitments and nullifiers and delegates proof validation to a generated ZK verifier. This is the architecture required to hide post-trade amounts rather than merely hiding pre-trade intent.

This separation prevents the demo from falsely claiming that standard ERC-20 transfers are private.

## 3. Authentication

The user connects an EVM wallet, receives a short-lived nonce, signs a human-readable login message, and the server verifies the signature with `viem.verifyMessage`. An HMAC-signed HTTP-only session cookie is issued for API access. Private keys never leave the wallet.

## 4. Private order flow

Every order receives:

- plaintext fields required by the trusted matching service during the MVP
- AES-256-GCM encrypted payload for storage
- SHA-256 commitment binding wallet, side, asset, price, quantity and timestamp

The public market view does not expose wallet identity. A production version would move matching into TEE/MPC/FHE or a ZK matching protocol so the operator also cannot read plaintext intent.

## 5. Matching engine

The matching engine is off-chain TypeScript using price-time priority. This is intentional: public smart contracts are a poor place to search/sort large books. The deterministic output is converted into a trade commitment that can be anchored on-chain.

## 6. HSK settlement

`VeilSettlement.sol` enforces:

- both parties are currently eligible
- trade cannot be reused
- buyer and seller separately approve
- both ERC-20 allowances exist through standard token semantics
- both legs transfer inside one transaction
- reentrancy protection

Atomicity means a revert restores the complete state; one party cannot receive the asset while the other payment leg fails.

## 7. Compliance

The MVP has a local `EligibilityRegistry.sol` for deterministic hackathon testing. HSK documentation also exposes a KYC SBT interface with verification levels/status. Production integration can replace or compose the demo registry with HSK-native KYC checks.

## 8. Selective disclosure

Matched trade metadata is encrypted. Standard `/api/trades` returns only commitment/proof/settlement state. `/api/regulator/trades` requires an authorization key and decrypts the underlying record. This is an application-level prototype of selective disclosure; production design would use institutional key management and auditable regulator view keys.

## 9. ZK extension

The Noir prototype privately proves balance sufficiency and participant eligibility. The final circuit design should additionally:

- hash old note preimages into existing commitments
- expose nullifiers for spent notes
- prove input value equals output value per asset
- bind the trade commitment to private asset/payment values
- prove eligible credential possession without revealing identity
- create new buyer/seller note commitments

The generated Solidity verifier replaces `DemoVerifier.sol`.

## 10. Why HSK Chain

HSK Chain is EVM compatible and exposes institutional/RWA-oriented infrastructure. VeilTrade uses HSK testnet (chain 133) for smart-contract execution, final settlement and public proof state while retaining Ethereum-compatible development tooling.

## 11. Roadmap

1. Generate/audit full Noir note-transition verifier.
2. Use HSK KYC SBT / verifiable credentials rather than local registry.
3. Move matching into a TEE or privacy-preserving matching network.
4. Add custody adapters and compliant token standards.
5. Add RFQ / block-trade negotiation and multi-asset support.
6. Add on-chain audit commitments and regulator access logging.
7. Formal verification and independent contract/circuit audits.
