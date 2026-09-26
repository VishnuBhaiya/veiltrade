# VeilTrade — Devfolio Submission Draft

## Tagline
The blockchain verifies the trade without seeing the trade.

## Track
- Sydney Hackathon
- HSK Chain
- HSK category: Blockchain Infrastructure

## Problem
Institutional tokenized-asset trading on public chains can expose commercially sensitive order size, timing, counterparties and positions. Private databases solve confidentiality but reintroduce trusted intermediaries and opaque settlement.

## Solution
VeilTrade is confidential, compliance-aware settlement infrastructure for tokenized RWAs on HSK Chain. Institutions authenticate with wallets, create encrypted order intents, match through deterministic price-time priority, and settle the RWA and stablecoin legs atomically. Public viewers see commitments/proof state rather than private trade metadata; authorized oversight can selectively disclose the underlying record.

## Key features
- Wallet-signature login
- Private institutional order book
- Matching engine with partial fills
- Encrypted private order/trade metadata
- Eligibility/KYC gating
- Atomic DvP smart contract on HSK testnet
- Selective regulator disclosure
- Commitment/nullifier shielded-settlement architecture
- Noir ZK circuit scaffold and pluggable verifier interface

## HSK integration
HSKChain Testnet (chain ID 133) is the execution and settlement layer. VeilTrade smart contracts are EVM compatible and include atomic RWA/stablecoin settlement plus eligibility checks. Transaction proofs can be inspected through the HSK testnet explorer.

## Technical honesty
The hackathon MVP provides functional HSK DvP and pre-trade/application-level privacy. Standard ERC-20 transfers remain publicly inspectable. The repository includes the shielded commitment/nullifier architecture and Noir verifier path required for full post-trade confidentiality; `DemoVerifier.sol` is explicitly marked development-only.

## Future
Full ZK note transitions, HSK KYC SBT credentials, TEE/MPC/FHE private matching, institutional custody adapters, RFQ/block trading and audited regulator view keys.
