create extension if not exists pgcrypto;

create table if not exists institutions (
  id text primary key,
  name text not null,
  wallet_address text unique not null,
  kyc_level smallint not null default 0,
  eligible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists assets (
  id text primary key,
  symbol text unique not null,
  name text not null,
  contract_address text,
  decimals smallint not null default 18,
  asset_type text not null check (asset_type in ('RWA','STABLECOIN')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  institution_id text,
  wallet_address text not null,
  asset_id text not null,
  side text not null check (side in ('BUY','SELL')),
  price numeric(30,8) not null check (price > 0),
  quantity numeric(30,8) not null check (quantity > 0),
  remaining_quantity numeric(30,8) not null check (remaining_quantity >= 0),
  commitment text unique not null,
  encrypted_payload text,
  status text not null check (status in ('OPEN','PARTIAL','MATCHED','CANCELLED')),
  created_at timestamptz not null default now()
);

create index if not exists orders_book_idx on orders(asset_id, status, side, price, created_at);

create table if not exists trades (
  id text primary key,
  buy_order_id text not null,
  sell_order_id text not null,
  asset_id text not null,
  buyer_wallet text not null,
  seller_wallet text not null,
  quantity numeric(30,8) not null,
  price numeric(30,8) not null,
  payment_amount numeric(30,8) not null,
  commitment text unique not null,
  proof_hash text,
  tx_hash text,
  regulator_payload text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table institutions enable row level security;
alter table assets enable row level security;
alter table orders enable row level security;
alter table trades enable row level security;
alter table audit_logs enable row level security;

-- Server-side access uses the Supabase service-role key, which bypasses RLS.
-- Public browser clients intentionally receive no direct table access in the hackathon MVP.
