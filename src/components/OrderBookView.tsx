'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, EyeOff, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { AppChrome } from './AppChrome';

type Asset={id:string;symbol:string;name:string;active:boolean;assetType:string;indicativePrice?:number};
type Order={id:string;assetId:string;side:'BUY'|'SELL';price:number;quantity:number;remainingQuantity:number;commitment:string;status:string;createdAt:string};

const qty=new Intl.NumberFormat('en-AU',{maximumFractionDigits:0});
const short=(v:string)=>v.length>18?`${v.slice(0,9)}…${v.slice(-7)}`:v;
const tone=(s:string)=>s==='vTBILL'?'aqua':s==='vMMF'?'violet':s==='vBOND'?'amber':'blue';

export function OrderBookView(){
  const [assets,setAssets]=useState<Asset[]>([]);
  const [selected,setSelected]=useState('');
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);

  async function load(){
    setLoading(true);
    try{
      const [a,o]=await Promise.all([fetch('/api/assets',{cache:'no-store'}),fetch('/api/orders',{cache:'no-store'})]);
      const aa=(await a.json()).assets?.filter((x:Asset)=>x.assetType==='RWA')||[];
      setAssets(aa);
      setSelected(prev=>prev&&aa.some((x:Asset)=>x.id===prev)?prev:(aa[0]?.id||''));
      setOrders((await o.json()).orders||[]);
    }finally{setLoading(false)}
  }

  useEffect(()=>{
    load().catch(()=>setLoading(false));
    const timer=window.setInterval(()=>load().catch(()=>null),5000);
    return()=>window.clearInterval(timer);
  },[]);

  const asset=assets.find(a=>a.id===selected);
  const active=useMemo(()=>orders.filter(o=>o.assetId===selected&&['OPEN','PARTIAL'].includes(o.status)&&o.remainingQuantity>0),[orders,selected]);
  const buys=useMemo(()=>active.filter(o=>o.side==='BUY').sort((a,b)=>b.price-a.price||+new Date(a.createdAt)-+new Date(b.createdAt)),[active]);
  const sells=useMemo(()=>active.filter(o=>o.side==='SELL').sort((a,b)=>a.price-b.price||+new Date(a.createdAt)-+new Date(b.createdAt)),[active]);
  const bestBid=buys[0]?.price||0;
  const bestAsk=sells[0]?.price||0;

  return <AppChrome>
    <section className="page-hero compact-hero">
      <div><div className="page-kicker"><Zap size={14}/> MULTI-ASSET ORDER BOOK</div><h1>Private order books</h1><p>Each tokenized fund has its own isolated liquidity pool, matching rules and commitment stream.</p></div>
      <div className="hero-actions-row"><span className="badge green"><Zap size={11}/> AUTO-MATCH</span><button className="btn" onClick={()=>load()} disabled={loading}><RefreshCw size={15}/>{loading?' Loading':' Refresh'}</button><Link href="/app" className="btn btn-primary">Create order</Link></div>
    </section>

    <div className="market-tabs">
      {assets.map(a=><button key={a.id} className={`market-tab ${selected===a.id?'active':''}`} onClick={()=>setSelected(a.id)}>
        <span className={`asset-dot ${tone(a.symbol)}`}/><b>{a.symbol}</b><small>{a.name}</small>
      </button>)}
    </div>

    <div className="explain-strip">
      <div><EyeOff size={17}/><span><b>Identity hidden</b><small>Market participants see price and liquidity, not the institutions behind orders.</small></span></div>
      <div><Zap size={17}/><span><b>Fund-specific matching</b><small>{asset?.symbol||'Selected asset'} can only match against the same asset.</small></span></div>
      <div><ShieldCheck size={17}/><span><b>Correct remaining balance</b><small>Matched quantity disappears from active liquidity immediately.</small></span></div>
    </div>

    <div className="orderbook-split">
      <section className="panel premium-panel">
        <div className="panel-head"><div><div className="panel-title"><ArrowUp size={16} className="buy-icon"/> {asset?.symbol} buyers</div><div className="panel-sub">Active BUY liquidity only</div></div><span className="price-chip buy-chip">Best ${bestBid.toFixed(2)}</span></div>
        <div className="table-wrap"><table className="market-table"><thead><tr><th>Price</th><th>Remaining</th><th>Proof commitment</th><th>Status</th></tr></thead><tbody>
          {buys.length?buys.map(o=><tr key={o.id}><td className="price-buy">${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)} {asset?.symbol}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge blue">{o.status}</span></td></tr>):<tr><td colSpan={4} className="empty-cell">No active {asset?.symbol} buy orders</td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel premium-panel">
        <div className="panel-head"><div><div className="panel-title"><ArrowDown size={16} className="sell-icon"/> {asset?.symbol} sellers</div><div className="panel-sub">Active SELL liquidity only</div></div><span className="price-chip sell-chip">Best ${bestAsk.toFixed(2)}</span></div>
        <div className="table-wrap"><table className="market-table"><thead><tr><th>Price</th><th>Remaining</th><th>Proof commitment</th><th>Status</th></tr></thead><tbody>
          {sells.length?sells.map(o=><tr key={o.id}><td className="price-sell">${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)} {asset?.symbol}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge blue">{o.status}</span></td></tr>):<tr><td colSpan={4} className="empty-cell">No active {asset?.symbol} sell orders</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  </AppChrome>;
}
