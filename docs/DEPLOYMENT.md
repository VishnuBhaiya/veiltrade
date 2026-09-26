# Cloud deployment

VeilTrade is designed to run with GitHub + Vercel + Supabase + HSKChain Testnet.

## Production environment variables

Set these in Vercel Project Settings -> Environment Variables for Production and Preview:

```env
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>
NEXT_PUBLIC_SUPABASE_URL=https://xbbktcezmhphvtheyqwf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase publishable/anon key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service-role secret>

SESSION_SECRET=<long random secret>
VEILTRADE_ENCRYPTION_KEY=<64 hex characters>
REGULATOR_DEMO_KEY=<demo-only disclosure key>
ADMIN_DEMO_KEY=<demo-only compliance key>

NEXT_PUBLIC_HSK_RPC_URL=https://testnet.hsk.xyz
NEXT_PUBLIC_HSK_EXPLORER_URL=https://testnet-explorer.hsk.xyz
NEXT_PUBLIC_HSK_CHAIN_ID=133

NEXT_PUBLIC_SETTLEMENT_CONTRACT=<after deployment>
NEXT_PUBLIC_MOCK_USDC=<after deployment>
NEXT_PUBLIC_MOCK_RWA=<after deployment>
NEXT_PUBLIC_ELIGIBILITY_REGISTRY=<after deployment>
```

Never commit the service-role key, wallet private keys, seed phrases, or deployment keys.

## Health check

After deployment open:

```text
https://<your-vercel-domain>/api/health
```

Expected before HSK contracts are deployed:

- app: true
- supabaseConfigured: true
- supabaseReachable: true
- hskRpcConfigured: true
- settlementContractConfigured: false

After contract addresses are added, settlementContractConfigured should become true.

## Supabase

The deployed project is in Sydney (ap-southeast-2). Direct anonymous table access is intentionally denied: RLS is enabled with no public policies, and the Next.js server accesses the database with the service-role secret. This keeps private order and trade rows out of browser-direct Supabase access.

## HSK deployment

Deploy with a fresh hackathon-only wallet funded with test HSK. Never place a real wallet private key in GitHub or chat.

The repository includes `scripts/deploy.js` and `scripts/seed-chain.js` for Hardhat deployment. A browser wallet deployment path may also be used for the demo; after deployment, copy only the public contract addresses into Vercel.
