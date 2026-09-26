create index if not exists trades_buyer_idx on public.trades (lower(buyer_wallet), created_at desc);
create index if not exists trades_seller_idx on public.trades (lower(seller_wallet), created_at desc);
create index if not exists trades_status_idx on public.trades (status, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_reference_idx on public.audit_logs (reference_id) where reference_id is not null;
