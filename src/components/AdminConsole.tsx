'use client';

import { useState } from 'react';
import { BadgeCheck, Building2, Check, CircleDollarSign, KeyRound, Layers3, LockKeyhole, Plus, Shield, ToggleLeft, ToggleRight, UserCheck, X } from 'lucide-react';

type Institution={id:string;name:string;walletAddress:string;kycLevel:number;eligible:boolean};
type Asset={id:string;symbol:string;name:string;description?:string;issuer?:string;contractAddress?:string;decimals:number;assetType:'RWA'|'STABLECOIN';active:boolean;indicativePrice?:number};
const short=(v:string)=>`${v.slice(0,8)}…${v.slice(-6)}`;
const tone=(s:string)=>s==='vTBILL'?'aqua':s==='vMMF'?'violet':s==='vBOND'?'amber':'blue';

const emptyFund={
  id:'asset-',
  symbol:'v',
  name:'',
  description:'',
  issuer:'Veil Asset Management',
  contractAddress:'',
  decimals:18,
  assetType:'RWA' as const,
  indicativePrice:10,
};

export function AdminConsole(){
  const [rows,setRows]=useState<Institution[]>([]);
  const [assets,setAssets]=useState<Asset[]>([]);
  const [adminKey,setAdminKey]=useState('veiltrade-admin-demo');
  const [msg,setMsg]=useState('');
  const [authorized,setAuthorized]=useState(false);
  const [verifying,setVerifying]=useState(false);
  const [tab,setTab]=useState<'institutions'|'funds'>('funds');
  const [showForm,setShowForm]=useState(false);
  const [fund,setFund]=useState({...emptyFund});

  async function verifyAndLoad(){
    setVerifying(true);setMsg('');
    try{
      const headers={'x-admin-key':adminKey};
      const [ir,ar]=await Promise.all([
        fetch('/api/admin/eligibility',{cache:'no-store',headers}),
        fetch('/api/admin/assets',{cache:'no-store',headers}),
      ]);
      const ij=await ir.json();const aj=await ar.json();
      if(!ir.ok) throw new Error(ij.error||'Admin authorization failed');
      if(!ar.ok) throw new Error(aj.error||'Asset registry authorization failed');
      setRows(ij.institutions||[]);setAssets(aj.assets||[]);
      setAuthorized(true);setMsg('Compliance workspace unlocked.');
    }catch(e:any){
      setAuthorized(false);setRows([]);setAssets([]);setMsg(e.message||'Admin authorization failed');
    }finally{setVerifying(false)}
  }

  async function toggleInstitution(r:Institution){
    if(!authorized)return;
    const res=await fetch('/api/admin/eligibility',{method:'POST',headers:{'content-type':'application/json','x-admin-key':adminKey},body:JSON.stringify({walletAddress:r.walletAddress,eligible:!r.eligible,kycLevel:r.kycLevel})});
    const body=await res.json().catch(()=>({}));
    if(!res.ok){setMsg(body.error||'Update failed');return}
    setMsg(`${r.name} updated.`);await verifyAndLoad();
  }

  async function saveFund(){
    setMsg('');
    const res=await fetch('/api/admin/assets',{method:'POST',headers:{'content-type':'application/json','x-admin-key':adminKey},body:JSON.stringify({...fund,indicativePrice:Number(fund.indicativePrice),decimals:Number(fund.decimals)})});
    const body=await res.json().catch(()=>({}));
    if(!res.ok){setMsg(typeof body.error==='string'?body.error:'Fund validation failed');return}
    setMsg(`${fund.symbol} market created.`);setFund({...emptyFund});setShowForm(false);await verifyAndLoad();
  }

  async function toggleAsset(a:Asset){
    const res=await fetch('/api/admin/assets',{method:'PATCH',headers:{'content-type':'application/json','x-admin-key':adminKey},body:JSON.stringify({id:a.id,active:!a.active})});
    const body=await res.json().catch(()=>({}));
    if(!res.ok){setMsg(body.error||'Fund status update failed');return}
    setMsg(`${a.symbol} ${a.active?'paused':'activated'}.`);await verifyAndLoad();
  }

  return <>
    <div className="topline">
      <div><span className="eyebrow"><Shield size={14}/> COMPLIANCE + ASSET OPERATIONS</span><h1 style={{marginTop:14}}>Institution & fund control</h1><p>Manage who can settle and which tokenized funds can trade through VeilTrade.</p></div>
      <span className={`access-status ${authorized?'verified':'locked'}`}>{authorized?<BadgeCheck size={15}/>:<LockKeyhole size={15}/>} {authorized?'Workspace unlocked':'Workspace locked'}</span>
    </div>

    <section className="panel access-gate">
      <div className="access-gate-copy"><div className="access-icon"><KeyRound size={20}/></div><div><div className="panel-title">Verify compliance operator</div><div className="panel-sub">Unlock institution eligibility and tokenized fund administration.</div></div></div>
      <div className="access-gate-form"><input className="input" type="password" value={adminKey} onChange={e=>{setAdminKey(e.target.value);setAuthorized(false);setRows([]);setAssets([]);setMsg('')}}/><button className="btn btn-primary" onClick={verifyAndLoad} disabled={verifying||!adminKey}>{verifying?'Verifying…':authorized?'Refresh access':'Verify & unlock'}</button></div>
      {msg&&<div className={authorized?'success':'error'}><Check size={13}/> {msg}</div>}
    </section>

    <div className="admin-tabs">
      <button className={tab==='funds'?'active':''} onClick={()=>setTab('funds')}><Layers3 size={15}/> Fund markets <span>{assets.filter(a=>a.assetType==='RWA').length}</span></button>
      <button className={tab==='institutions'?'active':''} onClick={()=>setTab('institutions')}><UserCheck size={15}/> Institutions <span>{rows.length}</span></button>
    </div>

    {tab==='funds'?<div className={authorized?'':'locked-section'}>
      <div className="fund-admin-head">
        <div><h2>Tokenized fund registry</h2><p>Create, activate and pause RWA markets without changing trading code.</p></div>
        <button className="btn btn-primary" disabled={!authorized} onClick={()=>setShowForm(true)}><Plus size={15}/> Add fund</button>
      </div>

      <div className="fund-admin-grid">
        {assets.filter(a=>a.assetType==='RWA').map(a=><article key={a.id} className={`fund-admin-card fund-${tone(a.symbol)} ${!a.active?'paused':''}`}>
          <div className="fund-card-orb"><Building2 size={20}/></div>
          <div className="fund-card-title"><div><span>{a.symbol} / vUSDC</span><h3>{a.name}</h3></div><span className={`badge ${a.active?'green':'orange'}`}>{a.active?'ACTIVE':'PAUSED'}</span></div>
          <p>{a.description||'Tokenized institutional fund market.'}</p>
          <div className="fund-card-meta"><span><small>Indicative NAV</small><b>${Number(a.indicativePrice||0).toFixed(2)}</b></span><span><small>Issuer</small><b>{a.issuer||'—'}</b></span><span><small>Decimals</small><b>{a.decimals}</b></span></div>
          <button className="btn btn-sm" onClick={()=>toggleAsset(a)} disabled={!authorized}>{a.active?<><ToggleRight size={15}/> Pause market</>:<><ToggleLeft size={15}/> Activate market</>}</button>
        </article>)}
        {authorized&&!assets.filter(a=>a.assetType==='RWA').length&&<div className="card"><p>No tokenized funds created yet.</p></div>}
      </div>
    </div>:<div className={authorized?'':'locked-section'}>
      <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Institution eligibility registry</div><div className="panel-sub">Counterparty policy enforced before settlement</div></div><span className={`badge ${authorized?'green':'orange'}`}><UserCheck size={11}/> {authorized?'policy active':'unlock required'}</span></div>
        <div className="table-wrap"><table><thead><tr><th>Institution</th><th>Wallet</th><th>KYC Level</th><th>Eligibility</th><th>Action</th></tr></thead><tbody>
          {authorized&&rows.length?rows.map(r=><tr key={r.id}><td><b>{r.name}</b></td><td className="mono muted">{short(r.walletAddress)}</td><td>Level {r.kycLevel}</td><td><span className={`badge ${r.eligible?'green':'orange'}`}>{r.eligible?'APPROVED':'BLOCKED'}</span></td><td><button className={`btn btn-sm ${r.eligible?'danger-soft':'success-soft'}`} onClick={()=>toggleInstitution(r)}>{r.eligible?'Block':'Approve'}</button></td></tr>):<tr><td colSpan={5} className="empty-cell">Verify access to reveal the registry.</td></tr>}
        </tbody></table></div>
      </section>
    </div>}

    {showForm&&<div className="modal-backdrop" onMouseDown={()=>setShowForm(false)}>
      <div className="fund-modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="fund-modal-head"><div><span className="eyebrow"><CircleDollarSign size={14}/> NEW TOKENIZED MARKET</span><h2>Add fund</h2></div><button className="icon-button" onClick={()=>setShowForm(false)}><X size={18}/></button></div>
        <div className="fund-form-grid">
          <div><label className="label">Asset ID</label><input className="input" value={fund.id} onChange={e=>setFund({...fund,id:e.target.value.toLowerCase().replace(/\s+/g,'-')})}/></div>
          <div><label className="label">Symbol</label><input className="input" value={fund.symbol} onChange={e=>setFund({...fund,symbol:e.target.value})}/></div>
          <div className="span-2"><label className="label">Fund name</label><input className="input" value={fund.name} onChange={e=>setFund({...fund,name:e.target.value})}/></div>
          <div className="span-2"><label className="label">Description</label><textarea className="textarea" rows={3} value={fund.description} onChange={e=>setFund({...fund,description:e.target.value})}/></div>
          <div><label className="label">Issuer</label><input className="input" value={fund.issuer} onChange={e=>setFund({...fund,issuer:e.target.value})}/></div>
          <div><label className="label">Indicative price (vUSDC)</label><input className="input" type="number" step="0.01" value={fund.indicativePrice} onChange={e=>setFund({...fund,indicativePrice:Number(e.target.value)})}/></div>
          <div><label className="label">Decimals</label><input className="input" type="number" value={fund.decimals} onChange={e=>setFund({...fund,decimals:Number(e.target.value)})}/></div>
          <div><label className="label">Contract address (optional)</label><input className="input" placeholder="0x…" value={fund.contractAddress} onChange={e=>setFund({...fund,contractAddress:e.target.value})}/></div>
        </div>
        <div className="modal-actions"><button className="btn" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={saveFund}><Plus size={14}/> Create fund market</button></div>
      </div>
    </div>}
  </>;
}
