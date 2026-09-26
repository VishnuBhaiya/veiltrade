-- Automatic exact-order matching.
-- Opposite orders match automatically when asset, price and remaining quantity are identical.
-- Same-wallet matches are forbidden. Matching happens inside the order-creation transaction.

create or replace function veil_private.match_exact_orders()
returns integer
language plpgsql
security definer
set search_path = public, veil_private, extensions, pg_temp
as $$
declare
  buy_id text;
  sell_id text;
  b public.orders%rowtype;
  s public.orders%rowtype;
  q numeric;
  px numeric;
  pay numeric;
  tid text;
  comm text;
  proof text;
  enc text;
  k text;
  matched_count integer := 0;
begin
  select value into k from veil_private.config where key='encryption_key';

  loop
    buy_id := null;
    sell_id := null;

    select bo.id, so.id into buy_id, sell_id
    from public.orders bo
    join public.orders so
      on bo.asset_id = so.asset_id
     and bo.side='BUY'
     and so.side='SELL'
     and bo.status in ('OPEN','PARTIAL')
     and so.status in ('OPEN','PARTIAL')
     and bo.remaining_quantity > 0
     and so.remaining_quantity > 0
     and bo.remaining_quantity = so.remaining_quantity
     and bo.price = so.price
     and lower(bo.wallet_address) <> lower(so.wallet_address)
    order by greatest(bo.created_at,so.created_at),bo.created_at,so.created_at
    limit 1;

    exit when buy_id is null or sell_id is null;

    select * into b from public.orders where id=buy_id for update;
    select * into s from public.orders where id=sell_id for update;

    if b.status not in ('OPEN','PARTIAL')
       or s.status not in ('OPEN','PARTIAL')
       or b.remaining_quantity <= 0
       or s.remaining_quantity <= 0
       or b.remaining_quantity <> s.remaining_quantity
       or b.price <> s.price
       or lower(b.wallet_address)=lower(s.wallet_address) then
      continue;
    end if;

    q := b.remaining_quantity;
    px := b.price;
    pay := round(q*px,2);
    tid := gen_random_uuid()::text;
    comm := '0x' || encode(digest(tid||'|'||b.id||'|'||s.id||'|'||q::text||'|'||px::text||'|'||clock_timestamp()::text,'sha256'),'hex');
    proof := '0x' || encode(digest(comm||'|verified','sha256'),'hex');

    enc := encode(pgp_sym_encrypt(
      jsonb_build_object('buyerWallet',b.wallet_address,'sellerWallet',s.wallet_address,'quantity',q,'price',px,'paymentAmount',pay)::text,
      k
    ),'base64');

    update public.orders set remaining_quantity=0,status='MATCHED' where id in (b.id,s.id);

    insert into public.trades(
      id,buy_order_id,sell_order_id,asset_id,buyer_wallet,seller_wallet,
      quantity,price,payment_amount,commitment,proof_hash,regulator_payload,status,created_at
    ) values (
      tid,b.id,s.id,b.asset_id,b.wallet_address,s.wallet_address,
      q,px,pay,comm,proof,enc,'MATCHED',now()
    );

    matched_count := matched_count + 1;
  end loop;

  return matched_count;
end;
$$;

revoke all on function veil_private.match_exact_orders() from public,anon,authenticated;

-- veil_create_order was replaced in the live database so it inserts the order,
-- invokes veil_private.match_exact_orders(), then returns:
-- { order, autoMatched, matchedCount, tradeId }.

select veil_private.match_exact_orders();
