-- Remove the old manual matcher endpoint path and make the public book active-liquidity only.

drop function if exists public.veil_run_matching();

create or replace function public.veil_public_orders()
returns table (
  id text, asset_id text, side text, price numeric, quantity numeric,
  remaining_quantity numeric, commitment text, status text, created_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select o.id,o.asset_id,o.side,o.price,o.quantity,o.remaining_quantity,o.commitment,o.status,o.created_at
  from public.orders o
  where o.status in ('OPEN','PARTIAL')
    and o.remaining_quantity > 0
  order by o.created_at asc;
$$;

revoke all on function public.veil_public_orders() from public;
grant execute on function public.veil_public_orders() to anon, authenticated;
