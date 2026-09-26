# VeilTrade Hackathon Setup Checklist

## Before coding / demo

- [ ] Node.js 20+ installed
- [ ] MetaMask installed
- [ ] HSKChain Testnet added (Chain ID 133)
- [ ] Test HSK received from https://faucet.hsk.xyz
- [ ] `npm install` completed
- [ ] `.env.local` created from `.env.example`
- [ ] Supabase migration applied
- [ ] Contracts compiled
- [ ] Contracts deployed to HSK testnet
- [ ] Contract addresses copied into `.env.local`
- [ ] Vercel environment variables configured
- [ ] Two team wallets available for buyer/seller demo
- [ ] Both wallets seeded with demo assets

## HSK MetaMask settings

```text
Network: HSKChain Testnet
RPC: https://testnet.hsk.xyz
Chain ID: 133
Symbol: HSK
Explorer: https://testnet-explorer.hsk.xyz
```

## Recommended demo wallets

Use two fresh hackathon-only MetaMask accounts. Never use a wallet holding valuable real assets.

- Wallet A: buyer — receives vUSDC
- Wallet B: seller — receives vTBILL

## Seed script

After deployment, add to local `.env`:

```env
BUYER_ADDRESS=0x...
SELLER_ADDRESS=0x...
MOCK_USDC_ADDRESS=0x...
MOCK_RWA_ADDRESS=0x...
ELIGIBILITY_REGISTRY_ADDRESS=0x...
```

Then:

```bash
npm run contracts:seed
```

## Final smoke test

- [ ] Wallet A can authenticate
- [ ] Wallet B can authenticate
- [ ] Private order can be created
- [ ] Crossing orders are matched
- [ ] Public trade tape hides amount / counterparties
- [ ] Regulator view reveals the same committed trade
- [ ] Buyer approves vUSDC
- [ ] Seller approves vTBILL
- [ ] Both approve settlement instruction
- [ ] `settle()` succeeds
- [ ] HSK explorer shows transaction
- [ ] GitHub README has install/run/integration details
- [ ] Vercel URL loads from phone / incognito browser
