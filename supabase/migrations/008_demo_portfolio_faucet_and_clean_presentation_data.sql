-- Presentation portfolio + idempotent demo faucet.
-- The live Supabase project also received a clean multi-market demo reset.

create table if not exists public.demo_portfolio_balances (
  wallet_address text not null,
  asset_id text not null references public.assets(id) on delete cascade,
  balance numeric(38,8) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (wallet_address, asset_id)
);

alter table public.demo_portfolio_balances enable row level security;
revoke all on public.demo_portfolio_balances from public, anon, authenticated;

-- RPCs applied live:
--   public.veil_demo_portfolio(wallet)
--   public.veil_demo_faucet(wallet)
-- The faucet tops a signed-in demo wallet up to:
--   250,000 vUSDC / 20,000 vTBILL / 8,000 vMMF / 4,000 vBOND.
-- It is intentionally a sandbox balance system and is kept distinct from HSK on-chain balances.
