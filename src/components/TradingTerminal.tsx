'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CheckCircle2, EyeOff, Gem, Landmark, LockKeyhole, RefreshCw, Scale, Sparkles, TrendingUp, X, Zap } from 'lucide-react';
import { AppChrome } from './AppChrome';

type Asset={id:string;symbol:string;name:string;description?:string;issuer?:string;assetType:'RWA'|'STABLECOIN';active:boolean;indicativePrice?:number};
type PublicOrder={id:string;assetId:string;side:'BUY'|'SELL';price:number;quantity:number;remainingQuantity:number;commitment:string;status:string;createdAt:string};
type PublicTrade={id:string;assetId:string;commitment:string;status:string;proofHash?:string;txHash?:string;createdAt:string;counterparties:string;amount:string;quantity:string};
type Toast={title:string;body:string;tone:'success'|'info'};

const money=new Intl.NumberFormat('en-AU',{style:'currency',currency:'USD',maximumFractionDigits:0});
const qty=new Intl.NumberFormat('en-AU',{maximumFractionDigits:0});
const short=(v:string)=>v&&v.length>16?`${v.slice(0,8)}…${v.slice(-6)}`:v;
const assetTone=(symbol:string)=>symbol==='vTBILL'?'aqua':symbol==='vMMF'?'violet':symbol==='vBOND'?'amber':'blue';

export function TradingTerminal(){
  const [assets,setAssets]=useState<Asset[]>([]);
  const [selectedAssetId,setSelectedAssetId]=useState('');
  const [orders,setOrders]=useState<PublicOrder[]>([]);
  const [trades,setTrades]=useState<PublicTrade[]>([]);
  const [wallet,setWallet]=useState('');
  const [side,setSide]=useState<'BUY'|'SELL'>('BUY');
  const [price,setPrice]=useState('10.11');
  const [quantity,setQuantity]=useState('75000');
  const [note,setNote]=useState('Block trade — confidential institutional intent');
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState('');
  const [toast,setToast]=useState<Toast|null>(null);
  const toastTimer=useRef<number|null>(null);

  function showToast(next:Toast){
    setToast(next);
    if(toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current=window.setTimeout(()=>setToast(null),6500);
  }

  async function refresh(){
    const [a,o,t]=await Promise.all([fetch('/api/assets',{cache:'no-store'}),fetch('/api/orders',{cache:'no-store'}),fetch('/api/trades',{cache:'no-store'})]);
    const nextAssets=((await a.json()).assets||[]).filter((x:Asset)=>x.assetType==='RWA'&&x.active);
    setAssets(nextAssets);
    setOrders((await o.json()).orders||[]);
    setTrades((await t.json()).trades||[]);
    setSelectedAssetId(prev=>prev&&nextAssets.some((x:Asset)=>x.id===prev)?prev:(nextAssets[0]?.id||''));
  }

  useEffect(()=>{
    refresh().catch(()=>null);
    const timer=window.setInterval(()=>refresh().catch(()=>null),5000);
    return()=>{window.clearInterval(timer);if(toastTimer.current)window.clearTimeout(toastTimer.current)};
  },[]);

  const asset=assets.find(a=>a.id===selectedAssetId);
  useEffect(()=>{if(asset?.indicativePrice)setPrice(asset.indicativePrice.toFixed(2))},[selectedAssetId]);

  const activeOrders=useMemo(()=>orders.filter(o=>o.assetId===selectedAssetId&&['OPEN','PARTIAL'].includes(o.status)&&o.remainingQuantity>0),[orders,selectedAssetId]);
  const buys=useMemo(()=>activeOrders.filter(o=>o.side==='BUY').sort((a,b)=>b.price-a.price||+new Date(a.createdAt)-+new Date(b.createdAt)).slice(0,8),[activeOrders]);
  const sells=useMemo(()=>activeOrders.filter(o=>o.side==='SELL').sort((a,b)=>a.price-b.price||+new Date(a.createdAt)-+new Date(b.createdAt)).slice(0,8),[activeOrders]);
  const marketTrades=useMemo(()=>trades.filter(t=>t.assetId===selectedAssetId),[trades,selectedAssetId]);
  const bestBid=buys[0]?.price||0;
  const bestAsk=sells[0]?.price||0;
  const spread=bestAsk&&bestBid?Math.max(0,bestAsk-bestBid):0;
  const openNotional=activeOrders.reduce((sum,o)=>sum+o.remainingQuantity*o.price,0);

  async function placeOrder(){
    try{
      setBusy(true);setFeedback('');
      if(!wallet) throw new Error('Connect & sign in once first.');
      if(!asset) throw new Error('Select an active fund first.');

      const res=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        assetId:asset.id,side,price:Number(price),quantity:Number(quantity),notes:note,
      })});
      const data=await res.json();
      if(!res.ok) throw new Error(typeof data.error==='string'?data.error:'Order could not be created.');

      if(data.autoMatched){
        const body=`${qty.format(Number(quantity))} ${asset.symbol} @ $${Number(price).toFixed(2)} · counterparty private · commitment verified · ready for settlement`;
        setFeedback(`Auto-matched instantly · trade ${short(data.tradeId)}`);
        showToast({title:'Private match found',body,tone:'success'});
      }else{
        setFeedback(`${asset.symbol} order committed · waiting for an exact opposite order · ${short(data.order.commitment)}`);
        showToast({title:'Order committed',body:`${side} ${qty.format(Number(quantity))} ${asset.symbol} @ $${Number(price).toFixed(2)} · waiting privately in the order book`,tone:'info'});
      }
      await refresh();
    }catch(e:any){
      setFeedback(e.message||'Order failed');
      showToast({title:'Order not submitted',body:e.message||'Order failed',tone:'info'});
    }finally{setBusy(false)}
  }

  return <AppChrome onAuthenticated={setWallet}>
    <section className="page-hero terminal-hero">
      <div><div className="page-kicker"><Sparkles size={14}/> MULTI-ASSET CONFIDENTIAL MARKET</div><h1>Private RWA Markets</h1><p>Trade multiple tokenized funds through isolated private order books, automatic matching and an HSK-ready settlement layer.</p></div>
      <div className="hero-actions-row"><span className="badge green"><Zap size={12}/> AUTO-MATCH ON</span><button className="btn" onClick={()=>refresh()}><RefreshCw size={14}/> Refresh</button></div>
    </section>

    <div className="market-switcher">
      {assets.map((a,i)=><button key={a.id} className={`market-card market-${assetTone(a.symbol)} ${selectedAssetId===a.id?'active':''}`} onClick={()=>setSelectedAssetId(a.id)}>
        <div className="market-card-top"><span className="market-logo">{i===0?<Landmark size={18}/>:i===1?<Gem size={18}/>:<Building2 size={18}/>}</span><span className="market-live"><span/> LIVE</span></div>
        <strong>{a.symbol}<small>/ vUSDC</small></strong><span>{a.name}</span>
        <div className="market-card-foot"><b>${(a.indicativePrice||0).toFixed(2)}</b><small>{a.issuer||'Veil Asset Management'}</small></div>
      </button>)}
    </div>

    <div className="market-context">
      <div><TrendingUp size={17}/><span><b>{asset?.name||'Select a fund'}</b><small>{asset?.description||'Choose a tokenized market above.'}</small></span></div>
      <div className="market-context-stats"><span><small>Market</small><b>{asset?.symbol||'—'} / vUSDC</b></span><span><small>Active orders</small><b>{activeOrders.length}</b></span><span><small>Matched trades</small><b>{marketTrades.length}</b></span></div>
    </div>

    <div className="metrics">
      <div className="metric metric-cyan"><small>Best bid</small><strong>${bestBid.toFixed(2)}</strong><div className="delta">Highest active BUY price</div></div>
      <div className="metric metric-rose"><small>Best ask</small><strong>${bestAsk.toFixed(2)}</strong><div className="delta">Lowest active SELL price</div></div>
      <div className="metric metric-violet"><small>Indicative spread</small><strong>${spread.toFixed(2)}</strong><div className="delta">Selected market only</div></div>
      <div className="metric metric-gold"><small>Open notional</small><strong>{money.format(openNotional)}</strong><div className="delta">{activeOrders.length} live order{activeOrders.length===1?'':'s'}</div></div>
    </div>

    <div className="dashboard-grid">
      <section className="panel market-panel">
        <div className="panel-head"><div><div className="panel-title">{asset?.symbol||'RWA'} confidential order book</div><div className="panel-sub">Only this fund's active unfilled liquidity is shown.</div></div><span className="badge blue"><LockKeyhole size={11}/> isolated market</span></div>
        <div className="table-wrap"><table><thead><tr><th>Side</th><th>Price</th><th>Remaining</th><th>Commitment</th><th>Status</th></tr></thead><tbody>
          {sells.map(o=><tr key={o.id}><td className="side-sell">SELL</td><td>${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)} {asset?.symbol}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge">{o.status}</span></td></tr>)}
          {buys.map(o=><tr key={o.id}><td className="side-buy">BUY</td><td>${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)} {asset?.symbol}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge">{o.status}</span></td></tr>)}
          {!buys.length&&!sells.length&&<tr><td colSpan={5} className="empty-cell"><b>No liquidity yet.</b><br/>Be the first institution to open this confidential market.</td></tr>}
        </tbody></table></div>
        <div className="privacy-strip"><div className="privacy-item"><small>Market isolation</small><strong>{asset?.symbol||'RWA'} only</strong></div><div className="privacy-item"><small>Matching rule</small><strong>Exact price + quantity</strong></div><div className="privacy-item"><small>Institution identity</small><strong>Hidden pre-trade</strong></div></div>
      </section>

      <section className="panel order-ticket">
        <div className="panel-head"><div><div className="panel-title">Create private intent</div><div className="panel-sub">{wallet?'Authenticated session · auto-match enabled':'Connect & sign in once'}</div></div><span className={`fund-pill fund-${assetTone(asset?.symbol||'')}`}>{asset?.symbol||'RWA'}</span></div>
        <div className="form">
          <label className="label">Selected fund</label>
          <select className="select" value={selectedAssetId} onChange={e=>setSelectedAssetId(e.target.value)}>{assets.map(a=><option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>)}</select>
          <div className="segmented"><button className={`seg ${side==='BUY'?'active-buy':''}`} onClick={()=>setSide('BUY')}>BUY</button><button className={`seg ${side==='SELL'?'active-sell':''}`} onClick={()=>setSide('SELL')}>SELL</button></div>
          <div className="two"><div><label className="label">Limit price (vUSDC)</label><input className="input" value={price} onChange={e=>setPrice(e.target.value)}/></div><div><label className="label">Quantity ({asset?.symbol||'RWA'})</label><input className="input" value={quantity} onChange={e=>setQuantity(e.target.value)}/></div></div>
          <label className="label">Private execution note</label><textarea className="textarea" rows={3} value={note} onChange={e=>setNote(e.target.value)}/>
          <div className="note"><b>Automatic matching:</b><br/>An opposite order in the same fund with the exact same price and quantity matches immediately. Same-wallet matches are blocked.</div>
          <button className="btn btn-primary" style={{width:'100%',marginTop:14}} onClick={placeOrder} disabled={busy||!wallet||!asset}>{busy?'Submitting…':`Commit ${side} ${asset?.symbol||''} order`}</button>
          {feedback&&<div className={feedback.includes('failed')||feedback.includes('Connect')?'error':'success'}>{feedback}</div>}
        </div>
      </section>
    </div>

    <div style={{height:16}}/>
    <section className="panel">
      <div className="panel-head"><div><div className="panel-title">{asset?.symbol||'RWA'} verified trade tape</div><div className="panel-sub">Matched trades for the selected market; commercial terms remain redacted publicly.</div></div><span className="badge green"><Scale size={11}/> {marketTrades.length} trades</span></div>
      <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Market</th><th>Commitment</th><th>Proof</th><th>Counterparties</th><th>Amount</th><th>Status</th></tr></thead><tbody>
        {marketTrades.map(t=><tr key={t.id}><td className="mono">{short(t.id)}</td><td><span className={`fund-pill mini fund-${assetTone(asset?.symbol||'')}`}>{asset?.symbol}</span></td><td className="mono muted">{short(t.commitment)}</td><td>{t.proofHash?<span className="badge green">VERIFIED</span>:<span className="badge orange">PENDING</span>}</td><td><span className="badge"><EyeOff size={11}/> PRIVATE</span></td><td>••••••••</td><td><span className="badge blue">{t.status}</span></td></tr>)}
        {!marketTrades.length&&<tr><td colSpan={7} className="empty-cell">No {asset?.symbol} matches yet.</td></tr>}
      </tbody></table></div>
    </section>

    {toast&&<div className={`trade-toast ${toast.tone}`} role="status">
      <span className="trade-toast-icon">{toast.tone==='success'?<CheckCircle2 size={18}/>:<Sparkles size={18}/>}</span>
      <div><b>{toast.title}</b><span>{toast.body}</span></div>
      <button onClick={()=>setToast(null)} aria-label="Dismiss"><X size={14}/></button>
    </div>}
  </AppChrome>;
}
