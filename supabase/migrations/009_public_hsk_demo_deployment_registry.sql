-- Publicly readable, admin-key-gated registry for the hackathon HSK demo deployment.
-- Applied live as migration: public_hsk_demo_deployment_registry.

create table if not exists public.demo_chain_deployment (
  singleton boolean primary key default true check (singleton),
  bootstrap_address text not null,
  settlement_address text not null,
  usdc_address text not null,
  rwa_address text not null,
  registry_address text not null,
  deployer_wallet text not null,
  tx_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.demo_chain_deployment enable row level security;
revoke all on public.demo_chain_deployment from public, anon, authenticated;

-- Live RPCs:
-- public.veil_public_chain_deployment()
-- public.veil_set_demo_chain_deployment(admin_key, bootstrap, settlement, usdc, rwa, registry, deployer, tx_hash)
-- Registration verifies a real HSK receipt in the Next.js API before persisting these public addresses.
