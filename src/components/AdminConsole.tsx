'use client';

import { useState } from 'react';
import { BadgeCheck, Check, KeyRound, LockKeyhole, Shield, UserCheck } from 'lucide-react';

type Institution={id:string;name:string;walletAddress:string;kycLevel:number;eligible:boolean};
const short=(v:string)=>`${v.slice(0,8)}…${v.slice(-6)}`;

export function AdminConsole(){
  const [rows,setRows]=useState<Institution[]>([]);
  const [adminKey,setAdminKey]=useState('veiltrade-admin-demo');
  const [msg,setMsg]=useState('');
  const [authorized,setAuthorized]=useState(false);
  const [verifying,setVerifying]=useState(false);

  async function verifyAndLoad(){
    setVerifying(true); setMsg('');
    try{
      const r=await fetch('/api/admin/eligibility',{cache:'no-store',headers:{'x-admin-key':adminKey}});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Admin authorization failed');
      setRows(j.institutions||[]);
      setAuthorized(true);
      setMsg('Admin access verified — registry unlocked.');
    }catch(e:any){
      setAuthorized(false); setRows([]); setMsg(e.message||'Admin authorization failed');
    }finally{setVerifying(false)}
  }

  async function toggle(r:Institution){
    if(!authorized) return;
    setMsg('');
    const res=await fetch('/api/admin/eligibility',{
      method:'POST',
      headers:{'content-type':'application/json','x-admin-key':adminKey},
      body:JSON.stringify({walletAddress:r.walletAddress,eligible:!r.eligible,kycLevel:r.kycLevel})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok){setAuthorized(false);setMsg(body.error||'Admin authorization failed');return;}
    setMsg(`${r.name} updated successfully.`);
    await verifyAndLoad();
  }

  return <>
    <div className="topline">
      <div>
        <span className="eyebrow"><Shield size={14}/> Compliance operations</span>
        <h1 style={{marginTop:14}}>Institution eligibility</h1>
        <p>Policy control for counterparties allowed to progress from private matching into HSK settlement.</p>
      </div>
      <span className={`access-status ${authorized?'verified':'locked'}`}>
        {authorized?<BadgeCheck size={15}/>:<LockKeyhole size={15}/>}
        {authorized?'Registry unlocked':'Registry locked'}
      </span>
    </div>

    <section className="panel access-gate">
      <div className="access-gate-copy">
        <div className="access-icon"><KeyRound size={20}/></div>
        <div>
          <div className="panel-title">Verify compliance operator</div>
          <div className="panel-sub">The key is checked by the protected Supabase policy function before any registry data is shown.</div>
        </div>
      </div>
      <div className="access-gate-form">
        <input className="input" type="password" value={adminKey} onChange={e=>{setAdminKey(e.target.value);setAuthorized(false);setRows([]);setMsg('')}}/>
        <button className="btn btn-primary" onClick={verifyAndLoad} disabled={verifying||!adminKey}>
          {verifying?'Verifying…':authorized?'Re-verify access':'Verify & unlock'}
        </button>
      </div>
      {msg&&<div className={authorized?'success':'error'}><Check size={13}/> {msg}</div>}
    </section>

    <div style={{height:16}}/>
    <div className={authorized?'':'locked-section'}>
      <section className="panel">
        <div className="panel-head">
          <div><div className="panel-title">Eligibility registry</div><div className="panel-sub">Only verified compliance operators can change participant eligibility</div></div>
          <span className={`badge ${authorized?'green':'orange'}`}><UserCheck size={11}/> {authorized?'policy active':'unlock required'}</span>
        </div>
        <div className="table-wrap">
          <table><thead><tr><th>Institution</th><th>Wallet</th><th>KYC Level</th><th>Eligibility</th><th>Action</th></tr></thead>
          <tbody>{authorized&&rows.length?rows.map(r=><tr key={r.id}>
            <td><b>{r.name}</b></td><td className="mono muted">{short(r.walletAddress)}</td><td>Level {r.kycLevel}</td>
            <td><span className={`badge ${r.eligible?'green':'orange'}`}>{r.eligible?'APPROVED':'BLOCKED'}</span></td>
            <td><button className={`btn btn-sm ${r.eligible?'danger-soft':'success-soft'}`} onClick={()=>toggle(r)} disabled={!authorized}>{r.eligible?'Block':'Approve'}</button></td>
          </tr>):<tr><td colSpan={5} className="empty-cell">{authorized?'No institutions found.':'Verify the admin key to reveal the protected registry.'}</td></tr>}</tbody></table>
        </div>
      </section>
    </div>

    <div className="grid-3" style={{marginTop:16}}>
      <div className="card feature-card"><div className="feature-glow teal"/><h3>Policy before settlement</h3><p>Eligibility is checked before a matched trade can reach the DvP contract path.</p></div>
      <div className="card feature-card"><div className="feature-glow violet"/><h3>Revocation aware</h3><p>The settlement contract design re-checks eligibility at execution time, not only at order creation.</p></div>
      <div className="card feature-card"><div className="feature-glow blue"/><h3>Auditable changes</h3><p>Every compliance state change is written into the backend audit trail for traceability.</p></div>
    </div>
  </>;
}
