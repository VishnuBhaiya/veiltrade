'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, EyeOff, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { AppChrome } from './AppChrome';

type Order = {
  id:string; assetId:string; side:'BUY'|'SELL'; price:number; quantity:number;
  remainingQuantity:number; commitment:string; status:string; createdAt:string;
};

const qty = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });
const short = (v:string) => v.length > 18 ? `${v.slice(0,9)}…${v.slice(-7)}` : v;

export function OrderBookView(){
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);

  async function load(){
    setLoading(true);
    try{
      const r=await fetch('/api/orders',{cache:'no-store'});
      const j=await r.json();
      setOrders(j.orders||[]);
    } finally { setLoading(false); }
  }
  useEffect(()=>{load().catch(()=>setLoading(false))},[]);

  const buys=useMemo(()=>orders.filter(o=>o.side==='BUY'&&['OPEN','PARTIAL'].includes(o.status)).sort((a,b)=>b.price-a.price),[orders]);
  const sells=useMemo(()=>orders.filter(o=>o.side==='SELL'&&['OPEN','PARTIAL'].includes(o.status)).sort((a,b)=>a.price-b.price),[orders]);
  const bestBid=buys[0]?.price||0;
  const bestAsk=sells[0]?.price||0;

  return <AppChrome>
    <section className="page-hero compact-hero">
      <div>
        <div className="page-kicker"><LockKeyhole size={14}/> PRE-TRADE PRIVACY</div>
        <h1>Private order book</h1>
        <p>See market liquidity without exposing the institutions behind each order. Every row is anchored by a cryptographic commitment.</p>
      </div>
      <div className="hero-actions-row">
        <button className="btn" onClick={()=>load()} disabled={loading}><RefreshCw size={15}/>{loading?' Loading':' Refresh'}</button>
        <Link href="/app" className="btn btn-primary">Create an order</Link>
      </div>
    </section>

    <div className="explain-strip">
      <div><EyeOff size={17}/><span><b>Identity stays hidden</b><small>Wallet and institution details are not shown to the market.</small></span></div>
      <div><ShieldCheck size={17}/><span><b>Commitment proves integrity</b><small>The hidden order cannot be silently changed after submission.</small></span></div>
      <div><LockKeyhole size={17}/><span><b>Matching uses price + time</b><small>Best executable price first, then oldest compatible order.</small></span></div>
    </div>

    <div className="orderbook-split">
      <section className="panel premium-panel">
        <div className="panel-head"><div><div className="panel-title"><ArrowUp size={16} className="buy-icon"/> Buyers</div><div className="panel-sub">Highest bids are matched first</div></div><span className="price-chip buy-chip">Best ${bestBid.toFixed(2)}</span></div>
        <div className="table-wrap"><table className="market-table"><thead><tr><th>Price</th><th>Available</th><th>Proof commitment</th><th>Status</th></tr></thead><tbody>
          {buys.length?buys.map(o=><tr key={o.id}><td className="price-buy">${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)} vTBILL</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge blue">{o.status}</span></td></tr>):<tr><td colSpan={4} className="empty-cell">No active buy orders</td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel premium-panel">
        <div className="panel-head"><div><div className="panel-title"><ArrowDown size={16} className="sell-icon"/> Sellers</div><div className="panel-sub">Lowest asks are matched first</div></div><span className="price-chip sell-chip">Best ${bestAsk.toFixed(2)}</span></div>
        <div className="table-wrap"><table className="market-table"><thead><tr><th>Price</th><th>Available</th><th>Proof commitment</th><th>Status</th></tr></thead><tbody>
          {sells.length?sells.map(o=><tr key={o.id}><td className="price-sell">${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)} vTBILL</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge blue">{o.status}</span></td></tr>):<tr><td colSpan={4} className="empty-cell">No active sell orders</td></tr>}
        </tbody></table></div>
      </section>
    </div>

    <div className="callout-card">
      <div className="callout-number">?</div>
      <div><b>Why hide the order book?</b><p>Large institutions do not want competitors learning who is building or unwinding a position before settlement. VeilTrade exposes only enough information to coordinate a market while keeping commercially sensitive details private.</p></div>
    </div>
  </AppChrome>;
}
