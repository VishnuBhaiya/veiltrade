-- Live migration applied to the Supabase project.
-- Adds settlement lifecycle persistence, prevents self-matching in the database matcher,
-- and backfills encrypted regulator payloads for seeded trades.

alter table public.trades add column if not exists buyer_allowance_tx_hash text;
alter table public.trades add column if not exists seller_allowance_tx_hash text;
alter table public.trades add column if not exists anchored_tx_hash text;
alter table public.trades add column if not exists buyer_approved boolean not null default false;
alter table public.trades add column if not exists seller_approved boolean not null default false;
alter table public.trades add column if not exists settlement_tx_hash text;

-- The live database also replaces veil_run_matching() with a version that only
-- pairs orders when lower(buyer_wallet) <> lower(seller_wallet), recreates
-- veil_trades_for_wallet(text) with lifecycle fields, adds
-- veil_update_trade_progress(wallet, trade, action, txHash), and encrypts
-- disclosure payloads for pre-existing seeded rows.
