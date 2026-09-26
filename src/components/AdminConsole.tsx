'use client';

import { useEffect, useState } from 'react';
import { Check, Shield, UserCheck } from 'lucide-react';

type Institution={id:string;name:string;walletAddress:string;kycLevel:number;eligible:boolean};
const short=(v:string)=>`${v.slice(0,8)}…${v.slice(-6)}`;

export function AdminConsole(){
  const [rows,setRows]=useState<Institution[]>([]);
  const [adminKey,setAdminKey]=useState('veiltrade-admin-demo');
  const [msg,setMsg]=useState('');

  async function load(key=adminKey){
    const r=await fetch('/api/admin/eligibility',{cache:'no-store',headers:{'x-admin-key':key}});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Admin authorization failed');return;}
    setRows(j.institutions||[]);
  }
  useEffect(()=>{load().catch(()=>null)},[]);

  async function toggle(r:Institution){
    setMsg('');
    const res=await fetch('/api/admin/eligibility',{method:'POST',headers:{'content-type':'application/json','x-admin-key':adminKey},body:JSON.stringify({walletAddress:r.walletAddress,eligible:!r.eligible,kycLevel:r.kycLevel})});
    const body=await res.json().catch(()=>({}));
    if(!res.ok){setMsg(body.error||'Admin authorization failed');return;}
    setMsg(`${r.name} updated`);
    await load();
  }

  return <>
    <div className="topline"><div><span className="eyebrow"><Shield size={14}/> Compliance operations</span><h1 style={{marginTop:14}}>Institution eligibility</h1><p>Hackathon registry mirrors the HSK KYC concept: only approved participants may settle through VeilTrade.</p></div></div>
    <div className="panel"><div className="panel-head"><div><div className="panel-title">Eligibility registry</div><div className="panel-sub">Demo administration layer; HSK on-chain registry contract included</div></div><span className="badge green"><UserCheck size={11}/> policy enforced</span></div>
      <div className="form"><label className="label">Hackathon admin key</label><input className="input" type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)}/><button className="btn btn-sm" style={{marginTop:10}} onClick={()=>load()}>Unlock registry</button></div>
      <div className="table-wrap"><table><thead><tr><th>Institution</th><th>Wallet</th><th>KYC Level</th><th>Eligibility</th><th>Action</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.name}</td><td className="mono muted">{short(r.walletAddress)}</td><td>Level {r.kycLevel}</td><td><span className={`badge ${r.eligible?'green':'orange'}`}>{r.eligible?'APPROVED':'BLOCKED'}</span></td><td><button className="btn btn-sm" onClick={()=>toggle(r)}>{r.eligible?'Block':'Approve'}</button></td></tr>)}</tbody></table></div>
      {msg&&<div className={msg.includes('updated')?'success':'error'} style={{padding:'0 18px 18px'}}><Check size={13}/> {msg}</div>}
    </div>
    <div className="note" style={{marginTop:16}}><b>Hackathon demo credential:</b> this key is intentionally prefilled for judges. Production replaces it with enterprise IAM / role-based access.</div>
  </>;
}
