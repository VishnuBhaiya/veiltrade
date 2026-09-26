insert into assets (id, symbol, name, decimals, asset_type)
values
  ('asset-vtbill','vTBILL','Veil Tokenized Treasury Fund',18,'RWA'),
  ('asset-usdc','vUSDC','Mock USD Coin',6,'STABLECOIN')
on conflict (id) do nothing;

insert into institutions (id, name, wallet_address, kyc_level, eligible)
values
  ('inst-harbour','Harbour Capital','0x1111111111111111111111111111111111111111',3,true),
  ('inst-southern','Southern Cross Treasury','0x2222222222222222222222222222222222222222',2,true),
  ('inst-pacific','Pacific Digital Markets','0x3333333333333333333333333333333333333333',3,true)
on conflict (id) do nothing;
