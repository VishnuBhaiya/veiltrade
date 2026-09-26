'use client';

import { useEffect, useMemo, useState } from 'react';
import { EyeOff, Landmark, LockKeyhole, Network, RefreshCw, Scale, Sparkles } from 'lucide-react';
import { AppChrome } from './AppChrome';

type PublicOrder = {
  id: string; assetId: string; side: 'BUY'|'SELL'; price: number; quantity: number;
  remainingQuantity: number; commitment: string; status: string; createdAt: string;
};
type PublicTrade = { id:string; assetId:string; commitment:string; status:string; proofHash?:string; txHash?:string; createdAt:string; counterparties:string; amount:string; quantity:string };

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const qty = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });
const short = (v:string) => v.length > 16 ? `${v.slice(0,8)}…${v.slice(-6)}` : v;

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
    const [o, t] = await Promise.all([fetch('/api/orders', { cache: 'no-store' }), fetch('/api/trades', { cache: 'no-store' })]);
    setOrders((await o.json()).orders || []);
    setTrades((await t.json()).trades || []);
  }
  useEffect(() => { refresh().catch(() => null); }, []);

  const buys = useMemo(() => orders.filter(o => o.side === 'BUY' && ['OPEN','PARTIAL'].includes(o.status)).sort((a,b)=>b.price-a.price).slice(0,7), [orders]);
  const sells = useMemo(() => orders.filter(o => o.side === 'SELL' && ['OPEN','PARTIAL'].includes(o.status)).sort((a,b)=>a.price-b.price).slice(0,7), [orders]);
  const bestBid = buys[0]?.price || 0;
  const bestAsk = sells[0]?.price || 0;
  const spread = bestAsk && bestBid ? Math.max(0, bestAsk-bestBid) : 0;
  const grossIntent = orders.reduce((s,o)=>s + o.remainingQuantity*o.price,0);

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

      setFeedback(`Private ${side.toLowerCase()} intent committed: ${short(data.order.commitment)}`);
      await refresh();
    } catch (e:any) {
      setFeedback(e.message || 'Order failed');
    } finally {
      setBusy(false);
    }
  }

  async function runMatcher() {
    try {
      setBusy(true); setFeedback('');
      const res = await fetch('/api/match', { method:'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Matcher failed.');
      setFeedback(data.matched ? `${data.matched} confidential match${data.matched>1?'es':''} created.` : 'No crossing orders at the moment.');
      await refresh();
    } catch(e:any) { setFeedback(e.message || 'Matcher failed'); }
    finally { setBusy(false); }
  }

  return (
    <AppChrome onAuthenticated={setWallet}>
      <section className="page-hero terminal-hero">
        <div>
          <div className="page-kicker"><Sparkles size={14}/> CONFIDENTIAL INSTITUTIONAL MARKET</div>
          <h1>Private RWA Market</h1>
          <p>Trade tokenized assets without broadcasting institution identities and sensitive order details before settlement.</p>
        </div>
        <div className="hero-actions-row"><button className="btn" onClick={()=>refresh()}><RefreshCw size={14}/> Refresh market</button><button className="btn btn-primary" onClick={runMatcher} disabled={busy}><Network size={14}/> Run matching engine</button></div>
      </section>

      <div className="demo-banner">
        <span className="demo-banner-label">3-minute demo</span>
        <span><b>1.</b> Sign in once</span><span className="demo-arrow">→</span>
        <span><b>2.</b> Create private orders without repeated signatures</span><span className="demo-arrow">→</span>
        <span><b>3.</b> Match + settle on HSK</span>
      </div>

      <div className="metrics">
        <div className="metric"><small>Best bid</small><strong>${bestBid.toFixed(2)}</strong><div className="delta">Private institutional intent</div></div>
        <div className="metric"><small>Best ask</small><strong>${bestAsk.toFixed(2)}</strong><div className="delta">Committed order flow</div></div>
        <div className="metric"><small>Indicative spread</small><strong>${spread.toFixed(2)}</strong><div className="delta">Price-time priority</div></div>
        <div className="metric"><small>Gross open intent</small><strong>{money.format(grossIntent)}</strong><div className="delta">Sensitive details encrypted in Supabase</div></div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head"><div><div className="panel-title">Confidential order book</div><div className="panel-sub">Price levels are public; identities stay behind commitments</div></div><span className="badge blue"><LockKeyhole size={11}/> pre-trade private</span></div>
          <div className="table-wrap">
            <table><thead><tr><th>Side</th><th>Price</th><th>Remaining</th><th>Commitment</th><th>Status</th></tr></thead>
              <tbody>
                {sells.map(o=><tr key={o.id}><td className="side-sell">SELL</td><td>${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge">{o.status}</span></td></tr>)}
                {buys.map(o=><tr key={o.id}><td className="side-buy">BUY</td><td>${o.price.toFixed(2)}</td><td>{qty.format(o.remainingQuantity)}</td><td className="mono muted">{short(o.commitment)}</td><td><span className="badge">{o.status}</span></td></tr>)}
              </tbody></table>
          </div>
          <div className="privacy-strip">
            <div className="privacy-item"><small>Identity</small><strong>Hidden from market participants</strong></div>
            <div className="privacy-item"><small>Private payload</small><strong>Encrypted inside Postgres</strong></div>
            <div className="privacy-item"><small>Integrity</small><strong>SHA-256 order commitment</strong></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><div className="panel-title">Create private intent</div><div className="panel-sub">{wallet ? 'Session authenticated · no repeated signatures' : 'Connect & sign in once'}</div></div><span className="badge green">vTBILL</span></div>
          <div className="form">
            <div className="segmented"><button className={`seg ${side==='BUY'?'active-buy':''}`} onClick={()=>setSide('BUY')}>BUY</button><button className={`seg ${side==='SELL'?'active-sell':''}`} onClick={()=>setSide('SELL')}>SELL</button></div>
            <div className="two"><div><label className="label">Limit price (vUSDC)</label><input className="input" value={price} onChange={e=>setPrice(e.target.value)} /></div><div><label className="label">Quantity (vTBILL)</label><input className="input" value={quantity} onChange={e=>setQuantity(e.target.value)} /></div></div>
            <label className="label">Private execution note</label><textarea className="textarea" rows={3} value={note} onChange={e=>setNote(e.target.value)} />
            <div className="note"><b>One signature, not one per order.</b><br/>Your first wallet sign-in creates a 12-hour browser session. Orders after that use the authenticated session; MetaMask only appears again for real blockchain transactions or after the session expires.</div>
            <button className="btn btn-primary" style={{width:'100%',marginTop:14}} onClick={placeOrder} disabled={busy||!wallet}>{busy?'Working…':`Commit ${side} order`}</button>
            {feedback && <div className={feedback.includes('failed') || feedback.includes('Connect') ? 'error':'success'}>{feedback}</div>}
          </div>
        </section>
      </div>

      <div style={{height:16}} />
      <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Verified settlement tape</div><div className="panel-sub">Public proof state without confidential commercial terms</div></div><span className="badge green"><Scale size={11}/> atomic DvP</span></div>
        <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Commitment</th><th>Proof</th><th>Counterparties</th><th>Amount</th><th>Status</th></tr></thead><tbody>
          {trades.map(t=><tr key={t.id}><td className="mono">{short(t.id)}</td><td className="mono muted">{short(t.commitment)}</td><td>{t.proofHash?<span className="badge green">VERIFIED</span>:<span className="badge orange">PENDING</span>}</td><td><span className="badge"><EyeOff size={11}/> PRIVATE</span></td><td>••••••••</td><td><span className="badge blue">{t.status}</span></td></tr>)}
        </tbody></table></div>
      </section>

      <div style={{height:16}} />
      <div className="grid-3">
        <div className="card"><div className="icon-chip"><Landmark size={18}/></div><h3>HSK settlement</h3><p>Functional Solidity contracts perform eligibility-gated, atomic RWA ↔ stablecoin delivery-versus-payment on HSK testnet.</p></div>
        <div className="card"><div className="icon-chip"><LockKeyhole size={18}/></div><h3>Shielded extension</h3><p>ConfidentialSettlement maintains commitments/nullifiers and accepts a pluggable ZK verifier generated from the Noir circuit.</p></div>
        <div className="card"><div className="icon-chip"><Scale size={18}/></div><h3>Regulatory access</h3><p>Authorized disclosure decrypts the matched trade record while the standard market view remains intentionally redacted.</p></div>
      </div>
    </AppChrome>
  );
}
