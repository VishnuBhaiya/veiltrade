'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, EyeOff, Fingerprint, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { AppChrome } from './AppChrome';

type Trade={id:string;assetId:string;commitment:string;status:string;proofHash?:string;txHash?:string;createdAt:string;counterparties:string;amount:string;quantity:string};
const short=(v:string)=>v&&v.length>18?`${v.slice(0,9)}…${v.slice(-7)}`:v;
const tone=(s:string)=>s==='SETTLED'?'green':s==='READY'?'violet':s==='APPROVAL_PENDING'?'orange':'blue';

export function MatchesView(){
  const [rows,setRows]=useState<Trade[]>([]);const [loading,setLoading]=useState(true);
  async function load(){setLoading(true);try{const r=await fetch('/api/trades',{cache:'no-store'});const j=await r.json();setRows(j.trades||[])}finally{setLoading(false)}}
  useEffect(()=>{load().catch(()=>setLoading(false))},[]);
  const matched=rows.filter(r=>r.status!=='SETTLED');
  const settled=rows.filter(r=>r.status==='SETTLED');

  return <AppChrome>
    <section className="page-hero compact-hero">
      <div><div className="page-kicker"><Fingerprint size={14}/> PRIVATE MATCHING</div><h1>Matched trades</h1><p>Crossing orders are paired only across different wallets. The public tape reveals integrity and lifecycle state without exposing commercial terms.</p></div>
      <div className="hero-actions-row"><span className="badge green"><Sparkles size={11}/> self-match protected</span><button className="btn" onClick={()=>load()} disabled={loading}><RefreshCw size={15}/>{loading?' Loading':' Refresh'}</button><Link href="/settlement" className="btn btn-primary">Open HSK settlement <ArrowRight size={15}/></Link></div>
    </section>

    <div className="metrics match-metrics">
      <div className="metric glow-metric"><small>In lifecycle</small><strong>{matched.length}</strong><div className="delta">Matched / approvals / ready</div></div>
      <div className="metric"><small>Settled</small><strong>{settled.length}</strong><div className="delta">Completed atomic DvP trades</div></div>
      <div className="metric"><small>Self-match policy</small><strong className="metric-word">BLOCKED</strong><div className="delta">Buyer and seller must differ</div></div>
      <div className="metric"><small>Verification model</small><strong className="metric-word">Commitment</strong><div className="delta">Proof-linked trade integrity</div></div>
    </div>

    <section className="panel premium-panel">
      <div className="panel-head"><div><div className="panel-title">Settlement lifecycle queue</div><div className="panel-sub">Status advances as HSK actions are confirmed and persisted</div></div><span className="badge green"><ShieldCheck size={11}/> proof-linked</span></div>
      <div className="table-wrap"><table className="market-table"><thead><tr><th>Trade</th><th>Commitment</th><th>Proof</th><th>Counterparties</th><th>Amount</th><th>Lifecycle</th><th>Next</th></tr></thead><tbody>
        {rows.length?rows.map(t=><tr key={t.id}>
          <td className="mono">{short(t.id)}</td><td className="mono muted">{short(t.commitment)}</td>
          <td>{t.proofHash?<span className="badge green"><CheckCircle2 size={11}/> VERIFIED</span>:<span className="badge orange">PENDING</span>}</td>
          <td><span className="badge"><EyeOff size={11}/> PRIVATE</span></td><td className="private-bars">••••••••</td><td><span className={`badge ${tone(t.status)}`}>{t.status}</span></td>
          <td>{t.status==='SETTLED'?<span className="success">Complete</span>:<Link href="/settlement" className="table-action">Continue <ArrowRight size={12}/></Link>}</td>
        </tr>):<tr><td colSpan={7} className="empty-cell">No matches yet. Create crossing orders from different wallets, then run the matching engine.</td></tr>}
      </tbody></table></div>
    </section>

    <div className="flow-card innovation-flow">
      <div className="flow-step done"><b>1</b><span>Private orders committed</span></div><ArrowRight size={18}/>
      <div className="flow-step done"><b>2</b><span>Self-match-safe pairing</span></div><ArrowRight size={18}/>
      <div className="flow-step"><b>3</b><span>HSK confirmations persisted</span></div><ArrowRight size={18}/>
      <div className="flow-step"><b>4</b><span>Atomic DvP complete</span></div>
    </div>
  </AppChrome>;
}
