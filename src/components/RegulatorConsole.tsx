'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';

type PrivateData = { buyerWallet:string; sellerWallet:string; quantity:number; price:number; paymentAmount:number };
type Row = {
  id:string; status:string; commitment:string; proofHash?:string; txHash?:string; createdAt:string;
  privateData?: PrivateData | null;
};
const short=(v:string)=>v?`${v.slice(0,9)}…${v.slice(-7)}`:'—';

export function RegulatorConsole(){
  const [key,setKey]=useState('veiltrade-regulator-demo');
  const [rows,setRows]=useState<Row[]>([]);
  const [error,setError]=useState('');
  const [revealed,setRevealed]=useState(false);
  const [busy,setBusy]=useState(false);

  async function unlock(){
    setBusy(true); setError('');
    try{
      const r=await fetch('/api/regulator/trades',{headers:{'x-regulator-key':key},cache:'no-store'});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Access denied');
      setRows(j.trades||[]); setRevealed(true);
    }catch(e:any){
      setRows([]);setRevealed(false);setError(e.message||'Access denied');
    }finally{setBusy(false)}
  }

  const disclosed=useMemo(()=>rows.filter(r=>r.privateData).length,[rows]);
  const notional=useMemo(()=>rows.reduce((sum,r)=>sum+(r.privateData?.paymentAmount||0),0),[rows]);

  return <>
    <div className="topline">
      <div>
        <span className="eyebrow"><ShieldCheck size={14}/> Authorized oversight</span>
        <h1 style={{marginTop:14}}>Selective disclosure console</h1>
        <p>Market participants see commitments. Authorized oversight can reveal the same committed trade without changing the public market view.</p>
      </div>
      <span className={`access-status ${revealed?'verified':'locked'}`}>
        {revealed?<BadgeCheck size={15}/>:<LockKeyhole size={15}/>}
        {revealed?'Disclosure authorized':'Disclosure locked'}
      </span>
    </div>

    {revealed&&<div className="verified-banner"><Sparkles size={16}/><div><b>Selective disclosure active</b><span>{disclosed} trade record{disclosed===1?'':'s'} decrypted for this authorized session.</span></div></div>}

    <div className="dashboard-grid">
      <section className="panel privacy-view-panel">
        <div className="panel-head"><div><div className="panel-title">Public market view</div><div className="panel-sub">What competitors and ordinary observers can see</div></div><span className="badge blue"><EyeOff size={11}/> redacted</span></div>
        <div className="disclosure" style={{padding:18,margin:0}}>
          <div className="card reveal-stat"><small>Counterparties</small><strong>PRIVATE</strong><span>Never shown on the market tape</span></div>
          <div className="card reveal-stat"><small>Commercial amount</small><strong>PRIVATE</strong><span>Quantity and payment remain hidden</span></div>
          <div className="card reveal-stat"><small>Integrity proof</small><strong className="accent-text">VERIFIABLE</strong><span>Commitment and proof state remain public</span></div>
        </div>
      </section>

      <section className="panel access-gate regulator-gate">
        <div className="access-gate-copy">
          <div className="access-icon violet"><KeyRound size={20}/></div>
          <div><div className="panel-title">Authorize regulator view</div><div className="panel-sub">Decrypt the protected disclosure payload for the demo oversight role.</div></div>
        </div>
        <div className="form" style={{paddingTop:8}}>
          <label className="label">Disclosure key</label>
          <input className="input" type="password" value={key} onChange={e=>{setKey(e.target.value);setRevealed(false);setRows([])}}/>
          <button className="btn btn-primary" style={{width:'100%',marginTop:12}} onClick={unlock} disabled={busy||!key}>
            <Eye size={14}/> {busy?'Authorizing…':revealed?'Refresh disclosure':'Authorize disclosure'}
          </button>
          {error&&<div className="error">{error}</div>}
        </div>
      </section>
    </div>

    <div className="metrics disclosure-metrics" style={{marginTop:16}}>
      <div className="metric"><small>Records disclosed</small><strong>{revealed?disclosed:'—'}</strong><div className="delta">Authorized session only</div></div>
      <div className="metric"><small>Visible notional</small><strong>{revealed?`$${notional.toLocaleString()}`:'PRIVATE'}</strong><div className="delta">Still hidden from public tape</div></div>
      <div className="metric"><small>Audit model</small><strong className="metric-word">Selective</strong><div className="delta">Access is logged</div></div>
      <div className="metric"><small>Public leakage</small><strong>0</strong><div className="delta">Commercial fields exposed publicly</div></div>
    </div>

    <section className="panel premium-panel">
      <div className="panel-head"><div><div className="panel-title">Authorized trade records</div><div className="panel-sub">Seeded and newly matched trades now include a disclosure payload</div></div><span className={`badge ${revealed?'green':'orange'}`}>{revealed?'DISCLOSED':'LOCKED'}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Buyer</th><th>Seller</th><th>Quantity</th><th>Price</th><th>Payment</th><th>Status</th></tr></thead><tbody>
        {(revealed&&rows.length?rows:[{id:'trade-locked',status:'LOCKED',commitment:'0x••••',createdAt:'',privateData:null}]).map((r:any)=><tr key={r.id}>
          <td className="mono">{short(r.id)}</td>
          <td className="mono">{r.privateData?short(r.privateData.buyerWallet):'••••••••'}</td>
          <td className="mono">{r.privateData?short(r.privateData.sellerWallet):'••••••••'}</td>
          <td>{r.privateData?r.privateData.quantity.toLocaleString():'PRIVATE'}</td>
          <td>{r.privateData?`$${Number(r.privateData.price).toFixed(2)}`:'PRIVATE'}</td>
          <td>{r.privateData?`$${r.privateData.paymentAmount.toLocaleString()}`:'PRIVATE'}</td>
          <td><span className={`badge ${r.status==='SETTLED'?'green':'blue'}`}>{r.status}</span></td>
        </tr>)}
      </tbody></table></div>
    </section>
  </>;
}
