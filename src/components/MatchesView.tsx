'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, EyeOff, Fingerprint, RefreshCw, ShieldCheck } from 'lucide-react';
import { AppChrome } from './AppChrome';

type Trade={id:string;assetId:string;commitment:string;status:string;proofHash?:string;txHash?:string;createdAt:string;counterparties:string;amount:string;quantity:string};
const short=(v:string)=>v&&v.length>18?`${v.slice(0,9)}…${v.slice(-7)}`:v;

export function MatchesView(){
  const [rows,setRows]=useState<Trade[]>([]);const [loading,setLoading]=useState(true);
  async function load(){setLoading(true);try{const r=await fetch('/api/trades',{cache:'no-store'});const j=await r.json();setRows(j.trades||[])}finally{setLoading(false)}}
  useEffect(()=>{load().catch(()=>setLoading(false))},[]);
  const matched=rows.filter(r=>r.status==='MATCHED'||r.status==='APPROVAL_PENDING'||r.status==='READY');
  const settled=rows.filter(r=>r.status==='SETTLED');

  return <AppChrome>
    <section className="page-hero compact-hero">
      <div><div className="page-kicker"><Fingerprint size={14}/> PRIVATE MATCHING</div><h1>Matched trades</h1><p>The matching engine pairs compatible buy and sell intents. Public observers see proof state, not the trade’s confidential commercial terms.</p></div>
      <div className="hero-actions-row"><button className="btn" onClick={()=>load()} disabled={loading}><RefreshCw size={15}/>{loading?' Loading':' Refresh'}</button><Link href="/settlement" className="btn btn-primary">Open HSK settlement <ArrowRight size={15}/></Link></div>
    </section>
    <div className="metrics match-metrics">
      <div className="metric glow-metric"><small>Matched & waiting</small><strong>{matched.length}</strong><div className="delta">Ready for participant approval</div></div>
      <div className="metric"><small>Already settled</small><strong>{settled.length}</strong><div className="delta">Completed atomic DvP trades</div></div>
      <div className="metric"><small>Public counterparties</small><strong>0</strong><div className="delta">Identity remains private</div></div>
      <div className="metric"><small>Verification model</small><strong className="metric-word">Commitment</strong><div className="delta">Proof-linked trade integrity</div></div>
    </div>
    <section className="panel premium-panel">
      <div className="panel-head"><div><div className="panel-title">Settlement queue</div><div className="panel-sub">Matched intents waiting for HSK execution</div></div><span className="badge green"><ShieldCheck size={11}/> proof-linked</span></div>
      <div className="table-wrap"><table className="market-table"><thead><tr><th>Trade</th><th>Commitment</th><th>Proof</th><th>Counterparties</th><th>Amount</th><th>Status</th><th>Next</th></tr></thead><tbody>
        {rows.length?rows.map(t=><tr key={t.id}>
          <td className="mono">{short(t.id)}</td><td className="mono muted">{short(t.commitment)}</td>
          <td>{t.proofHash?<span className="badge green"><CheckCircle2 size={11}/> VERIFIED</span>:<span className="badge orange">PENDING</span>}</td>
          <td><span className="badge"><EyeOff size={11}/> PRIVATE</span></td><td className="private-bars">••••••••</td><td><span className={`badge ${t.status==='SETTLED'?'green':'blue'}`}>{t.status}</span></td>
          <td>{t.status==='SETTLED'?<span className="muted">Done</span>:<Link href="/settlement" className="table-action">Settle <ArrowRight size={12}/></Link>}</td>
        </tr>):<tr><td colSpan={7} className="empty-cell">No matches yet. Create crossing buy and sell orders, then run the matching engine.</td></tr>}
      </tbody></table></div>
    </section>
    <div className="flow-card">
      <div className="flow-step done"><b>1</b><span>Private orders committed</span></div><ArrowRight size={18}/>
      <div className="flow-step done"><b>2</b><span>Matching engine pairs them</span></div><ArrowRight size={18}/>
      <div className="flow-step"><b>3</b><span>Both parties approve</span></div><ArrowRight size={18}/>
      <div className="flow-step"><b>4</b><span>HSK settles both legs atomically</span></div>
    </div>
  </AppChrome>;
}
