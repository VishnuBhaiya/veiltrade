'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, EyeOff, Fingerprint, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { AppChrome } from './AppChrome';

type Asset={id:string;symbol:string;name:string;assetType:string};
type Trade={id:string;assetId:string;commitment:string;status:string;proofHash?:string;txHash?:string;createdAt:string;counterparties:string;amount:string;quantity:string};
const short=(v:string)=>v&&v.length>18?`${v.slice(0,9)}…${v.slice(-7)}`:v;
const statusTone=(s:string)=>s==='SETTLED'?'green':s==='READY'?'violet':s==='APPROVAL_PENDING'?'orange':'blue';
const fundTone=(s:string)=>s==='vTBILL'?'aqua':s==='vMMF'?'violet':s==='vBOND'?'amber':'blue';

export function MatchesView(){
  const [assets,setAssets]=useState<Asset[]>([]);
  const [selected,setSelected]=useState('all');
  const [rows,setRows]=useState<Trade[]>([]);
  const [loading,setLoading]=useState(true);

  async function load(){
    setLoading(true);
    try{
      const [a,t]=await Promise.all([fetch('/api/assets',{cache:'no-store'}),fetch('/api/trades',{cache:'no-store'})]);
      setAssets((await a.json()).assets?.filter((x:Asset)=>x.assetType==='RWA')||[]);
      setRows((await t.json()).trades||[]);
    }finally{setLoading(false)}
  }
  useEffect(()=>{load().catch(()=>setLoading(false))},[]);

  const assetMap=useMemo(()=>Object.fromEntries(assets.map(a=>[a.id,a])),[assets]);
  const visible=useMemo(()=>selected==='all'?rows:rows.filter(r=>r.assetId===selected),[rows,selected]);
  const matched=visible.filter(r=>r.status!=='SETTLED');
  const settled=visible.filter(r=>r.status==='SETTLED');

  return <AppChrome>
    <section className="page-hero compact-hero">
      <div><div className="page-kicker"><Fingerprint size={14}/> MULTI-MARKET MATCHING</div><h1>Matched trades</h1><p>Review private matches across every tokenized fund while each market remains logically isolated.</p></div>
      <div className="hero-actions-row"><span className="badge green"><Sparkles size={11}/> self-match protected</span><button className="btn" onClick={()=>load()} disabled={loading}><RefreshCw size={15}/>{loading?' Loading':' Refresh'}</button><Link href="/settlement" className="btn btn-primary">Open settlement <ArrowRight size={15}/></Link></div>
    </section>

    <div className="market-tabs compact">
      <button className={`market-tab ${selected==='all'?'active':''}`} onClick={()=>setSelected('all')}><span className="asset-dot prism"/><b>ALL</b><small>All tokenized funds</small></button>
      {assets.map(a=><button key={a.id} className={`market-tab ${selected===a.id?'active':''}`} onClick={()=>setSelected(a.id)}><span className={`asset-dot ${fundTone(a.symbol)}`}/><b>{a.symbol}</b><small>{a.name}</small></button>)}
    </div>

    <div className="metrics match-metrics">
      <div className="metric metric-cyan"><small>In lifecycle</small><strong>{matched.length}</strong><div className="delta">Matched / approvals / ready</div></div>
      <div className="metric metric-violet"><small>Settled</small><strong>{settled.length}</strong><div className="delta">Completed atomic DvP trades</div></div>
      <div className="metric metric-gold"><small>Markets</small><strong>{assets.length}</strong><div className="delta">Active RWA funds</div></div>
      <div className="metric metric-rose"><small>Self-match policy</small><strong className="metric-word">BLOCKED</strong><div className="delta">Counterparties must differ</div></div>
    </div>

    <section className="panel premium-panel">
      <div className="panel-head"><div><div className="panel-title">Settlement lifecycle queue</div><div className="panel-sub">Automatic exact matches across isolated fund markets</div></div><span className="badge green"><ShieldCheck size={11}/> proof-linked</span></div>
      <div className="table-wrap"><table className="market-table"><thead><tr><th>Trade</th><th>Fund</th><th>Commitment</th><th>Proof</th><th>Counterparties</th><th>Amount</th><th>Lifecycle</th><th>Next</th></tr></thead><tbody>
        {visible.length?visible.map(t=>{
          const a=assetMap[t.assetId];
          return <tr key={t.id}>
            <td className="mono">{short(t.id)}</td>
            <td><span className={`fund-pill mini fund-${fundTone(a?.symbol||'')}`}>{a?.symbol||t.assetId}</span></td>
            <td className="mono muted">{short(t.commitment)}</td>
            <td>{t.proofHash?<span className="badge green"><CheckCircle2 size={11}/> VERIFIED</span>:<span className="badge orange">PENDING</span>}</td>
            <td><span className="badge"><EyeOff size={11}/> PRIVATE</span></td><td className="private-bars">••••••••</td>
            <td><span className={`badge ${statusTone(t.status)}`}>{t.status}</span></td>
            <td>{t.status==='SETTLED'?<span className="success">Complete</span>:<Link href="/settlement" className="table-action">Continue <ArrowRight size={12}/></Link>}</td>
          </tr>
        }):<tr><td colSpan={8} className="empty-cell">No matches for this market yet.</td></tr>}
      </tbody></table></div>
    </section>
  </AppChrome>;
}
