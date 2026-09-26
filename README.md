# VeilTrade

> **Private markets for tokenized real-world assets. Trade confidentially. Settle atomically. Disclose selectively.**

VeilTrade is a multi-market, compliance-aware infrastructure prototype for tokenized real-world assets on **HSK Chain**. It combines wallet authentication, isolated private order books, exact automatic matching, cryptographic commitments, compliance controls, selective regulator disclosure, a demo institutional portfolio, and an atomic delivery-versus-payment Solidity path.

Built by **Team VeilForge** for the Sydney HSK Chain hackathon.

## Live demo

Production: `https://veiltrade.vercel.app`

### Demo markets
- **vTBILL / vUSDC** — Veil Tokenized Treasury Fund
- **vMMF / vUSDC** — Veil Money Market Fund
- **vBOND / vUSDC** — Veil Investment Grade Bond Fund

## What works in the cloud demo

- One MetaMask signature creates a 12-hour VeilTrade browser session.
- Multi-fund market selector and isolated order books.
- Exact automatic matching: same asset + same price + same quantity + opposite side + different wallet.
- Matched orders disappear from active liquidity immediately.
- Public market APIs redact institution identity and commercial trade fields.
- Encrypted private order and regulator payloads in Supabase/Postgres.
- Regulator selective-disclosure console.
- Compliance institution registry and fund administration.
- Demo portfolio and idempotent **Get demo assets** faucet.
- Persistent settlement lifecycle fields for HSK confirmations.
- Solidity contracts and tests for eligibility-gated atomic DvP.
- Noir circuit scaffold plus a commitment/nullifier shielded-settlement extension.

## Important privacy / deployment truthfulness

The current cloud demo provides **pre-trade/application confidentiality**, commitment-based public views and selective disclosure. Standard ERC-20 transfers on the functional `VeilSettlement.sol` path are public on-chain. `ConfidentialSettlement.sol` and the Noir circuit represent the shielded extension.

`DemoVerifier.sol` is development-only and is **not** a production ZK verifier.

The production web app only enables the real HSK settlement transaction buttons after deployed public contract addresses are configured. Until then, the Portfolio page labels its faucet balances as **demo sandbox inventory**, not on-chain assets.

## Routes

- `/` — product landing page
- `/app` — multi-fund trading terminal
- `/orderbook` — isolated private order books
- `/matches` — cross-market match queue
- `/portfolio` — demo wallet inventory + faucet
- `/settlement` — HSK atomic DvP workbench
- `/regulator` — selective disclosure
- `/admin` — compliance + fund administration

## HSK Chain

- Network: **HSKChain Testnet**
- Chain ID: **133**
- RPC: `https://testnet.hsk.xyz`
- Explorer: `https://testnet-explorer.hsk.xyz`

The functional `VeilSettlement.sol` contract re-checks eligibility at settlement time and transfers the RWA and payment legs in one transaction. Either both transfers complete or the transaction reverts.

## Demo flow

1. Open **Demo walkthrough** in the top bar.
2. Connect an HSK-compatible wallet and sign in once.
3. Open **Portfolio** and use **Get demo assets** for sandbox inventory.
4. Select vTBILL, vMMF or vBOND.
5. Create an order from wallet A.
6. Create the exact opposite order — same fund, price and quantity — from wallet B.
7. VeilTrade auto-matches immediately; there is no manual matcher button.
8. Show **Matches** where identities and amounts remain redacted.
9. Open **Regulator View** to selectively disclose the committed record.
10. If HSK contract addresses are configured, continue through allowance → anchor → two-party approval → atomic DvP.

## Smart contracts

- `MockUSDC.sol`
- `MockRWA.sol`
- `EligibilityRegistry.sol`
- `HSKKycEligibilityAdapter.sol`
- `VeilSettlement.sol`
- `ConfidentialSettlement.sol`
- `DemoVerifier.sol`

## Local quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Track

**Primary:** Blockchain Infrastructure  
**Use case:** RWA / institutional settlement  
**Supporting:** Payments, stablecoins, privacy and compliance
