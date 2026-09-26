'use client';

import { useEffect, useMemo, useState } from 'react';
import { EyeOff, Landmark, LockKeyhole, RefreshCw, Scale, Sparkles, Zap } from 'lucide-react';
import { AppChrome } from './AppChrome';

type PublicOrder = {
  id: string; assetId: string; side: 'BUY'|'SELL'; price: number; quantity: number;
  remainingQuantity: number; commitment: string; status: string; createdAt: string;
};
type PublicTrade = { id:string; assetId:string; commitment:string; status:string; proofHash?:string; txHash?:string; createdAt:string; counterparties:string; amount:string; quantity:string };

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const qty = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });
const short = (v:string) => v && v.length > 16 ? `${v.slice(0,8)}…${v.slice(-6)}` : v;

export function TradingTerminal() {
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [trades, setTrades] = useState<PublicTrade[]>([]);
  const [wallet, setWallet] = useState('');
  const [side, setSide] = useState<'BUY'|'SELL'>('BUY');
  const [price, setPrice] = useState('10.11');
  const [quantity, setQuantity] = useState('75000');
  const [note, setNote] = useState('Block trade — confidential institutional intent');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function refresh() {
    const [o, t] = await Promise.all([
      fetch('/api/orders', { cache: 'no-store' }),
      fetch('/api/trades', { cache: 'no-store' }),
    ]);
    setOrders((await o.json()).orders || []);
    setTrades((await t.json()).trades || []);
  }

  useEffect(() => {
    refresh().catch(() => null);
    const timer = window.setInterval(() => refresh().catch(() => null), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const activeOrders = useMemo(
    () => orders.filter(o => ['OPEN','PARTIAL'].includes(o.status) && o.remainingQuantity > 0),
    [orders],
  );
  const buys = useMemo(
    () => activeOrders.filter(o => o.side === 'BUY').sort((a,b)=>b.price-a.price || +new Date(a.createdAt)-+new Date(b.createdAt)).slice(0,7),
    [activeOrders],
  );
  const sells = useMemo(
    () => activeOrders.filter(o => o.side === 'SELL').sort((a,b)=>a.price-b.price || +new Date(a.createdAt)-+new Date(b.createdAt)).slice(0,7),
    [activeOrders],
  );
  const bestBid = buys[0]?.price || 0;
  const bestAsk = sells[0]?.price || 0;
  const spread = bestAsk && bestBid ? Math.max(0, bestAsk-bestBid) : 0;
  const openNotional = activeOrders.reduce((sum,o)=>sum + o.remainingQuantity * o.price,0);

  async function placeOrder() {
    try {
      setBusy(true);
      setFeedback('');
      if (!wallet) throw new Error('Connect & sign in once first.');

      const res = await fetch('/api/orders', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          assetId:'asset-vtbill',
          side,
          price:Number(price),
          quantity:Number(quantity),
          notes:note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Order could not be created.');

      if (data.autoMatched) {
        setFeedback(`Auto-matched instantly · ${qty.format(Number(quantity))} vTBILL @ $${Number(price).toFixed(2)} · trade ${short(data.tradeId)}`);
      } else {
        setFeedback(`Order committed · waiting for an opposite order with the same price and quantity · ${short(data.order.commitment)}`);
      }
      await refresh();
    } catch (e:any) {
      setFeedback(e.message || 'Order failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome onAuthenticated={setWallet}>
      <section className="page-hero terminal-hero">
        <div>
          <div className="page-kicker"><Sparkles size={14}/> CONFIDENTIAL INSTITUTIONAL MARKET</div>
          <h1>Private RWA Market</h1>
          <p>Exact opposite orders match automatically. There is no manual matching step and matched quantities disappear from the open book immediately.</p>
        </div>
        <div className="hero-actions-row">
          <span className="badge green"><Zap size={12}/> AUTO-MATCH ON</span>
          <button className="btn" onClick={()=>refresh()}><RefreshCw size={14}/> Refresh market</button>
        </div>
      </section>

      <div className="demo-banner">
        <span className="demo-banner-label">Automatic market flow</span>
        <span><b>1.</b> Create private order</span><span className="demo-arrow">→</span>
        <span><b>2.</b> Same price + same quantity auto-match</span><span className="demo-arrow">→</span>
        <span><b>3.</b> Trade appears in Matches</span>
      </div>

      <div className="metrics">
        <div className="metric"><small>Best bid</small><strong>${bestBid.toFixed(2)}</strong><div className="delta">Highest active BUY price</div></div>
        <div className="metric"><small>Best ask</small><strong>${bestAsk.toFixed(2)}</strong><div className="delta">Lowest active SELL price</div></div>
        <div className="metric"><small>Indicative spread</small><strong>${spread.toFixed(2)}</strong><div className="delta">Open book only</div></div>
        <div className="metric"><small>Open book notional</small><strong>{money.format(openNotional)}</strong><div className="delta">{activeOrders.length} active order{activeOrders.length===1?'':'s'} · matched orders removed</div></div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Confidential order book</div>
              <div className="panel-sub">Only unfilled quantity is shown. Exact matches are removed immediately.</div>
            </div>
            <span className="badge blue"><LockKeyhole size={11}/> pre-trade private</span>
          </div>
          <div className="table-wrap">
            <table><thead><tr><th>Side</th><th>Price</th><th>Remaining</th><th>Commitment</th><th>Status</th></tr></thead>
              <tbody>
                {sells.map(o=><tr key={o.id}><td className="side-sell">SELL</td><td>${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge">{o.status}</span></td></tr>)}
                {buys.map(o=><tr key={o.id}><td className="side-buy">BUY</td><td>${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge">{o.status}</span></td></tr>)}
                {!buys.length&&!sells.length&&<tr><td colSpan={5} className="empty-cell">No active orders — the book is fully matched.</td></tr>}
              </tbody></table>
          </div>
          <div className="privacy-strip">
            <div className="privacy-item"><small>Matching rule</small><strong>Same price + same quantity</strong></div>
            <div className="privacy-item"><small>Self matching</small><strong>Blocked across same wallet</strong></div>
            <div className="privacy-item"><small>Book accounting</small><strong>Remaining quantity only</strong></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><div className="panel-title">Create private intent</div><div className="panel-sub">{wallet ? 'Session authenticated · auto-match enabled' : 'Connect & sign in once'}</div></div><span className="badge green">vTBILL</span></div>
          <div className="form">
            <div className="segmented"><button className={`seg ${side==='BUY'?'active-buy':''}`} onClick={()=>setSide('BUY')}>BUY</button><button className={`seg ${side==='SELL'?'active-sell':''}`} onClick={()=>setSide('SELL')}>SELL</button></div>
            <div className="two"><div><label className="label">Limit price (vUSDC)</label><input className="input" value={price} onChange={e=>setPrice(e.target.value)} /></div><div><label className="label">Quantity (vTBILL)</label><input className="input" value={quantity} onChange={e=>setQuantity(e.target.value)} /></div></div>
            <label className="label">Private execution note</label><textarea className="textarea" rows={3} value={note} onChange={e=>setNote(e.target.value)} />
            <div className="note"><b>Automatic matching:</b><br/>When another wallet has the opposite side at the exact same price and remaining quantity, both orders are filled atomically in the database and a confidential trade is created immediately.</div>
            <button className="btn btn-primary" style={{width:'100%',marginTop:14}} onClick={placeOrder} disabled={busy||!wallet}>{busy?'Submitting…':`Commit ${side} order`}</button>
            {feedback && <div className={feedback.includes('failed') || feedback.includes('Connect') ? 'error':'success'}>{feedback}</div>}
          </div>
        </section>
      </div>

      <div style={{height:16}} />
      <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Verified settlement tape</div><div className="panel-sub">New automatic matches appear here immediately while confidential terms stay redacted publicly</div></div><span className="badge green"><Scale size={11}/> matched trades</span></div>
        <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Commitment</th><th>Proof</th><th>Counterparties</th><th>Amount</th><th>Status</th></tr></thead><tbody>
          {trades.map(t=><tr key={t.id}><td className="mono">{short(t.id)}</td><td className="mono muted">{short(t.commitment)}</td><td>{t.proofHash?<span className="badge green">VERIFIED</span>:<span className="badge orange">PENDING</span>}</td><td><span className="badge"><EyeOff size={11}/> PRIVATE</span></td><td>••••••••</td><td><span className="badge blue">{t.status}</span></td></tr>)}
        </tbody></table></div>
      </section>

      <div style={{height:16}} />
      <div className="grid-3">
        <div className="card"><div className="icon-chip"><Zap size={18}/></div><h3>Automatic exact matching</h3><p>Opposite orders with the same price and quantity are paired immediately without a manual engine button.</p></div>
        <div className="card"><div className="icon-chip"><LockKeyhole size={18}/></div><h3>Correct open-book accounting</h3><p>Only remaining unfilled quantity contributes to the open book notional; matched orders disappear from active liquidity.</p></div>
        <div className="card"><div className="icon-chip"><Landmark size={18}/></div><h3>HSK settlement path</h3><p>The confidential match then progresses into the eligibility-gated atomic DvP settlement lifecycle.</p></div>
      </div>
    </AppChrome>
  );
}
