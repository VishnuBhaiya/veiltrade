'use client';

import { Landmark, Sparkles } from 'lucide-react';
import type { Asset } from '@/lib/types';

export function MarketSwitcher({
  assets,
  value,
  onChange,
  compact = false,
}: {
  assets: Asset[];
  value: string;
  onChange: (asset: Asset) => void;
  compact?: boolean;
}) {
  const markets = assets.filter((a) => a.assetType === 'RWA' && a.active);

  return (
    <div className={'market-switcher ' + (compact ? 'compact' : '')}>
      {markets.map((asset, index) => {
        const active = asset.id === value;
        return (
          <button
            key={asset.id}
            type="button"
            className={'market-tile market-tone-' + (index % 4) + (active ? ' active' : '')}
            onClick={() => onChange(asset)}
          >
            <span className="market-orb">{active ? <Sparkles size={15}/> : <Landmark size={15}/>}</span>
            <span className="market-copy">
              <b>{asset.symbol} <em>/ vUSDC</em></b>
              {!compact && <small>{asset.name}</small>}
            </span>
            <span className="market-price">
              <small>Indicative</small>
              <b>{'$' + (asset.indicativePrice || 0).toFixed(2)}</b>
            </span>
          </button>
        );
      })}
    </div>
  );
}
