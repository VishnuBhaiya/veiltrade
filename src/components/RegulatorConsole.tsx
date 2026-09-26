'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

type Row = {
  id:string; status:string; commitment:string; proofHash?:string; txHash?:string; createdAt:string;
  privateData?: { buyerWallet:string; sellerWallet:string; quantity:number; price:number; paymentAmount:number } | null;
};
const short=(v:string)=>v?`${v.slice(0,9)}…${v.slice(-7)}`:'—';

export function RegulatorConsole(){
  const [key,setKey]=useState('veiltrade-regulator-demo');
  const [rows,setRows]=useState<Row[]>([]);
  const [error,setError]=useState('');
  const [revealed,setRevealed]=useState(false);

  async function unlock(){
    setError('');
    const r=await fetch('/api/regulator/trades',{headers:{'x-regulator-key':key},cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setError(j.error||'Access denied');return;}
    setRows(j.trades||[]);setRevealed(true);
  }

  return <>
    <div className="topline"><div><span className="eyebrow"><ShieldCheck size={14}/> Authorized oversight</span><h1 style={{marginTop:14}}>Selective disclosure console</h1><p>The public market does not receive the underlying trade record. An authorized oversight key can disclose it.</p></div></div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Public HSK view</div><div className="panel-sub">What ordinary observers are allowed to learn</div></div><span className="badge blue"><EyeOff size={11}/> redacted</span></div>
        <div className="disclosure" style={{padding:18,margin:0}}>
          <div className="card"><small className="muted">Counterparties</small><strong>PRIVATE</strong></div>
          <div className="card"><small className="muted">Trade amount</small><strong>PRIVATE</strong></div>
          <div className="card"><small className="muted">Settlement proof</small><strong style={{color:'#9ff1d5'}}>VERIFIABLE</strong></div>
        </div>
      </section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Regulator access</div><div className="panel-sub">Hackathon selective-disclosure credential</div></div><KeyRound size={17} color="#76f7d2"/></div><div className="form"><label className="label">Disclosure key</label><input className="input" type="password" value={key} onChange={e=>setKey(e.target.value)}/><button className="btn btn-primary" style={{width:'100%',marginTop:12}} onClick={unlock}><Eye size={14}/> Authorize disclosure</button>{error&&<div className="error">{error}</div>}</div></section>
    </div>
    <div style={{height:16}}/>
    <section className="panel"><div className="panel-head"><div><div className="panel-title">Authorized trade record</div><div className="panel-sub">Encrypted database record revealed only after authorization</div></div><span className={`badge ${revealed?'green':''}`}>{revealed?'DISCLOSED':'LOCKED'}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Buyer</th><th>Seller</th><th>Quantity</th><th>Payment</th><th>Status</th></tr></thead><tbody>
        {(rows.length?rows:[{id:'trade-locked',status:'LOCKED',commitment:'0x••••',createdAt:'',privateData:null}]).map((r:any)=><tr key={r.id}><td className="mono">{short(r.id)}</td><td className="mono">{r.privateData?short(r.privateData.buyerWallet):'••••••••'}</td><td className="mono">{r.privateData?short(r.privateData.sellerWallet):'••••••••'}</td><td>{r.privateData?r.privateData.quantity.toLocaleString():'PRIVATE'}</td><td>{r.privateData?`$${r.privateData.paymentAmount.toLocaleString()}`:'PRIVATE'}</td><td><span className="badge green">{r.status}</span></td></tr>)}
      </tbody></table></div>
    </section>
    <div className="note" style={{marginTop:16}}><b>Demo disclosure:</b> trade payloads are encrypted inside Postgres with a key held in a private database schema. Public APIs return only commitments/proof state.</div>
  </>;
}
