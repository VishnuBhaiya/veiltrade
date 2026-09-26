# VeilTrade

> **The blockchain verifies the trade without seeing the trade.**

VeilTrade is a confidential, compliance-aware settlement layer for tokenized real-world assets on **HSK Chain**. It combines wallet authentication, a private institutional order book, a price-time matching engine, encrypted order payloads, cryptographic commitments, compliance controls, atomic delivery-versus-payment (DvP), selective regulator disclosure, and a shielded ZK settlement extension.

Built by **Team VeilForge** for the Sydney HSK Chain hackathon.

## What works in the MVP

- MetaMask wallet-signature authentication
- Dedicated private order-book and match views
- Price-time priority matching with partial fills
- Encrypted private order/trade metadata
- Public commitment-based market view
- Compliance eligibility registry
- Atomic RWA ↔ stablecoin DvP Solidity contract
- HSKChain Testnet configuration (Chain ID **133**)
- Regulator selective-disclosure console
- Supabase/PostgreSQL schema and persistence path
- Noir circuit scaffold
- Commitment/nullifier confidential-settlement contract

## Architecture

```text
Institution wallets
      │
      ├── signed login
      ▼
Next.js app
      │
      ├── encrypted order payloads ──► Supabase/Postgres
      ├── cryptographic commitments
      ▼
Price-time matching engine
      │
      ├── matched trade commitment
      └── encrypted regulator disclosure
      ▼
HSK Chain
      │
      ├── EligibilityRegistry.sol
      ├── VeilSettlement.sol
      └── ConfidentialSettlement.sol
                 │
                 └── Noir ZK verifier path
```

## HSK Chain

- Network: `HSKChain Testnet`
- Chain ID: `133`
- Gas token: `HSK`
- RPC: `https://testnet.hsk.xyz`
- Explorer: `https://testnet-explorer.hsk.xyz`

The functional `VeilSettlement.sol` path performs eligibility-gated atomic DvP. Both legs either transfer together or the transaction reverts.

## Privacy model

### Working MVP
- Market views hide institution identity.
- Orders are bound by cryptographic commitments.
- Private payloads are encrypted server-side.
- Public trade APIs redact counterparties and amounts.
- Authorized regulator access can disclose encrypted trade records.

### Shielded extension
`ConfidentialSettlement.sol` implements commitments, nullifiers and a pluggable ZK-verifier interface. The Noir circuit in `circuits/private_trade` is the privacy-proof prototype.

**Important:** `DemoVerifier.sol` is development-only. The public ERC-20 DvP path is verifiable, but its final on-chain transfers are not confidential.

## Routes

- `/` — product landing page
- `/app` — advanced trading terminal
- `/orderbook` — private order book
- `/matches` — match queue
- `/settlement` — HSK atomic DvP workbench
- `/regulator` — selective disclosure
- `/admin` — compliance administration

## Local quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase credentials the application runs with an in-memory seeded demo store.

## Supabase

Apply:

```text
supabase/migrations/001_init.sql
supabase/seed.sql
```

Then configure the Supabase URL, anon key and service-role key in the deployment environment.

## Smart contracts

- `MockUSDC.sol`
- `MockRWA.sol`
- `EligibilityRegistry.sol`
- `HSKKycEligibilityAdapter.sol`
- `VeilSettlement.sol`
- `ConfidentialSettlement.sol`
- `DemoVerifier.sol`

## Demo flow

1. Connect an HSK-compatible wallet.
2. Create a private buy or sell intent.
3. Create a crossing counter-order.
4. Run the matching engine.
5. Show the match while identity and amount remain redacted publicly.
6. Open regulator view to selectively disclose the same trade.
7. Open HSK settlement.
8. Approve assets and both counterparties.
9. Execute atomic DvP.
10. Open the transaction in the HSK explorer.

## Track

**Primary:** Blockchain Infrastructure  
**Use case:** RWA / institutional settlement  
**Supporting:** Payments, stablecoins, privacy and compliance

See `docs/TECHNICAL.md`, `docs/SECURITY.md`, `docs/DEMO_SCRIPT.md`, and `docs/PITCH_QA.md` for the architecture and pitch material.
