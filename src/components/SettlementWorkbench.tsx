'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, CheckCircle2, ExternalLink, Loader2, LockKeyhole, RefreshCw, Rocket, ShieldAlert, TimerReset } from 'lucide-react';
import { parseUnits } from 'viem';
import { WalletButton } from './WalletButton';
import { approveOnchainTrade, approveToken, createOnchainTrade, explorerTx, settleOnchainTrade, waitForHskTransaction } from '@/lib/onchain';

type Trade={
  id:string;buyerWallet:string;sellerWallet:string;quantity:number;paymentAmount:number;commitment:`0x${string}`;
  assetId:string;status:string;price:number;proofHash?:string;txHash?:string;buyerAllowanceTxHash?:string;
  sellerAllowanceTxHash?:string;anchoredTxHash?:string;buyerApproved?:boolean;sellerApproved?:boolean;settlementTxHash?:string;
};
type Deployment={bootstrapAddress:string;settlementAddress:string;usdcAddress:string;rwaAddress:string;registryAddress:string;deployerWallet:string;txHash:string};
const label=(id:string)=>id==='asset-vtbill'?'vTBILL':id==='asset-vmmf'?'vMMF':id==='asset-vbond'?'vBOND':'RWA';
const short=(v:string)=>v?`${v.slice(0,8)}…${v.slice(-6)}`:'—';

export function SettlementWorkbench(){
  const [account,setAccount]=useState('');
  const [trades,setTrades]=useState<Trade[]>([]);
  const [selected,setSelected]=useState('');
  const [busy,setBusy]=useState('');
  const [lastTx,setLastTx]=useState('');
  const [feedback,setFeedback]=useState('');
  const [deployment,setDeployment]=useState<Deployment|null>(null);

  async function loadDeployment(){
    const r=await fetch('/api/deployment',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setDeployment(j.deployment||null);
  }

  async function load(){
    if(!account)return;
    const r=await fetch('/api/trades/mine',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok)throw new Error(j.error||'Could not load private trades');
    setTrades(j.trades||[]);
    setSelected(prev=>prev&&j.trades?.some((t:Trade)=>t.id===prev)?prev:(j.trades?.[0]?.id||''));
  }

  useEffect(()=>{loadDeployment().catch(()=>null)},[]);
  useEffect(()=>{if(account)load().then(()=>setFeedback('Private trade session active — no extra signature required.')).catch(e=>setFeedback(e.message||'Trade access failed'))},[account]);

  const trade=trades.find(t=>t.id===selected);
  const settlement=(deployment?.settlementAddress||process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT) as `0x${string}`|undefined;
  const usdc=(deployment?.usdcAddress||process.env.NEXT_PUBLIC_MOCK_USDC) as `0x${string}`|undefined;
  const rwa=(deployment?.rwaAddress||process.env.NEXT_PUBLIC_MOCK_RWA) as `0x${string}`|undefined;
  const configured=Boolean(settlement&&usdc&&rwa);
  const chainCompatible=trade?.assetId==='asset-vtbill';
  const current=account.toLowerCase();
  const role=trade?current===trade.buyerWallet.toLowerCase()?'buyer':current===trade.sellerWallet.toLowerCase()?'seller':'observer':'observer';
  const myAllowance=trade?(role==='buyer'?trade.buyerAllowanceTxHash:role==='seller'?trade.sellerAllowanceTxHash:undefined):undefined;
  const myApproval=trade?(role==='buyer'?trade.buyerApproved:role==='seller'?trade.sellerApproved:false):false;
  const bothAllowances=Boolean(trade?.buyerAllowanceTxHash&&trade?.sellerAllowanceTxHash);
  const bothApproved=Boolean(trade?.buyerApproved&&trade?.sellerApproved);
  const readyToSettle=Boolean(chainCompatible&&trade?.anchoredTxHash&&bothAllowances&&bothApproved&&trade?.status!=='SETTLED');

  const stage=useMemo(()=>{
    if(!trade)return 0;
    if(trade.status==='SETTLED'||trade.settlementTxHash)return 5;
    if(bothApproved&&bothAllowances&&trade.anchoredTxHash)return 4;
    if(trade.buyerApproved||trade.sellerApproved)return 3;
    if(trade.anchoredTxHash)return 2;
    if(trade.buyerAllowanceTxHash||trade.sellerAllowanceTxHash)return 1;
    return 0;
  },[trade,bothApproved,bothAllowances]);

  async function persist(action:'ALLOWANCE'|'ANCHOR'|'APPROVE'|'SETTLE',hash:`0x${string}`){
    if(!trade)return;
    const r=await fetch(`/api/trades/${trade.id}/progress`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,txHash:hash})});
    const j=await r.json();
    if(!r.ok)throw new Error(j.error||'Could not persist settlement progress');
    setTrades(prev=>prev.map(t=>t.id===trade.id?{...t,...j.trade}:t));
  }

  async function action(name:string,kind:'ALLOWANCE'|'ANCHOR'|'APPROVE'|'SETTLE',fn:()=>Promise<`0x${string}`>){
    try{
      setBusy(name);setFeedback(`${name}: waiting for wallet transaction confirmation…`);
      const hash=await fn();setLastTx(hash);
      setFeedback(`${name}: submitted to HSK, waiting for confirmation…`);
      await waitForHskTransaction(hash);
      setFeedback(`${name}: confirmed on HSK, saving lifecycle progress…`);
      await persist(kind,hash);
      setFeedback(`${name} confirmed and recorded.`);
    }catch(e:any){setFeedback(e?.shortMessage||e?.message||`${name} failed`)}
    finally{setBusy('')}
  }

  return <div className="content-stack">
    <div className="topline">
      <div><span className="eyebrow">HSK CHAIN EXECUTION</span><h1 style={{marginTop:14}}>Atomic DvP settlement</h1><p>vTBILL is the wired on-chain demo market. vMMF and vBOND remain confidential cloud-market prototypes in this hackathon build.</p></div>
      <WalletButton onAuthenticated={setAccount}/>
    </div>

    {!configured?<div className="verified-banner warning-banner"><ShieldAlert size={18}/><div><b>HSK contracts are not registered yet</b><span>Use the launchpad to deploy the functional vTBILL/vUSDC testnet stack with one MetaMask transaction.</span></div><Link href="/deploy" className="btn btn-sm">Open launchpad <Rocket size={13}/></Link></div>
    :<div className="verified-banner"><BadgeCheck size={18}/><div><b>HSK settlement stack connected</b><span>VeilSettlement {short(settlement!)} · vUSDC {short(usdc!)} · vTBILL {short(rwa!)}</span></div></div>}

    <div className="settlement-stepper">{[['Allowance','Token spend approved'],['Anchor','Trade instruction on HSK'],['Approvals','Buyer + seller consent'],['Ready','Both sides complete'],['Settled','Atomic DvP confirmed']].map((item,i)=><div key={item[0]} className={`settlement-step ${stage>i?'complete':''} ${stage===i?'current':''}`}><span className="step-index">{stage>i?<BadgeCheck size={14}/>:i+1}</span><span><b>{item[0]}</b><small>{item[1]}</small></span></div>)}</div>

    <div className="dashboard-grid settlement-grid">
      <section className="panel premium-panel">
        <div className="panel-head"><div><div className="panel-title">My matched trades</div><div className="panel-sub">Wallet-private access using the same 12-hour signed session</div></div><button className="btn btn-sm" onClick={()=>load().catch(e=>setFeedback(e.message))} disabled={!account||!!busy}><RefreshCw size={13}/> Refresh</button></div>
        <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Market</th><th>Qty</th><th>Payment</th><th>Status</th></tr></thead><tbody>
          {trades.length?trades.map(t=><tr key={t.id} onClick={()=>setSelected(t.id)} className={selected===t.id?'selected-row':''} style={{cursor:'pointer'}}><td className="mono">{short(t.id)}</td><td><span className="fund-pill mini">{label(t.assetId)}</span></td><td>{t.quantity.toLocaleString()} {label(t.assetId)}</td><td>{t.paymentAmount.toLocaleString()} vUSDC</td><td><span className={`badge ${t.status==='SETTLED'?'green':t.status==='READY'?'violet':'blue'}`}>{t.status}</span></td></tr>):<tr><td colSpan={5} className="empty-cell">Connect & sign in once to reveal matched trades for this wallet.</td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel settlement-control">
        <div className="panel-head"><div><div className="panel-title">Execution control</div><div className="panel-sub">{trade?`Role: ${role.toUpperCase()} · ${label(trade.assetId)} · ${short(trade.id)}`:'Select a matched trade'}</div></div><span className={`badge ${readyToSettle?'green':'orange'}`}>{readyToSettle?'READY':chainCompatible?'SEQUENCED':'CLOUD ONLY'}</span></div>
        {!chainCompatible&&trade&&<div className="chain-scope-note"><ShieldAlert size={15}/><span><b>{label(trade.assetId)} is not wired to the demo DvP contract.</b> The live HSK path intentionally uses vTBILL/vUSDC; the other fund markets demonstrate the reusable private-market layer.</span></div>}
        <div className="form settlement-actions">
          <div className={`action-row ${myAllowance?'done':''}`}><div><b>1. Token allowance</b><small>{myAllowance?`Confirmed ${short(myAllowance)}`:`Approve ${role==='buyer'?'vUSDC':'vTBILL'} spending`}</small></div><button disabled={!trade||!configured||!chainCompatible||role==='observer'||!!busy||!!myAllowance} className="btn" onClick={()=>trade&&action('Token allowance','ALLOWANCE',()=>approveToken(role==='buyer'?usdc!:rwa!,settlement!,role==='buyer'?parseUnits(String(trade.paymentAmount),6):parseUnits(String(trade.quantity),18),account as `0x${string}`))}>{myAllowance?<CheckCircle2 size={14}/>:busy==='Token allowance'?<Loader2 size={14}/>:null}{myAllowance?'Confirmed':'Approve'}</button></div>
          <div className={`action-row ${trade?.anchoredTxHash?'done':''}`}><div><b>2. Anchor trade</b><small>{trade?.anchoredTxHash?`Confirmed ${short(trade.anchoredTxHash)}`:'Create matched trade instruction on HSK'}</small></div><button disabled={!trade||!configured||!chainCompatible||role==='observer'||!!busy||!myAllowance||!!trade?.anchoredTxHash} className="btn" onClick={()=>trade&&action('Trade anchor','ANCHOR',()=>createOnchainTrade({settlement:settlement!,id:trade.id,buyer:trade.buyerWallet as `0x${string}`,seller:trade.sellerWallet as `0x${string}`,assetAmount:parseUnits(String(trade.quantity),18),paymentAmount:parseUnits(String(trade.paymentAmount),6),commitment:trade.commitment,account:account as `0x${string}`}))}>{trade?.anchoredTxHash?'Anchored':'Anchor'}</button></div>
          <div className={`action-row ${myApproval?'done':''}`}><div><b>3. Counterparty approval</b><small>{myApproval?`${role} approval confirmed`:trade?.anchoredTxHash?`Approve as ${role}`:'Waiting for anchor'}</small></div><button disabled={!trade||!configured||!chainCompatible||role==='observer'||!!busy||!trade?.anchoredTxHash||!!myApproval} className="btn" onClick={()=>trade&&action('Trade approval','APPROVE',()=>approveOnchainTrade(settlement!,trade.id,account as `0x${string}`))}>{myApproval?'Approved':'Approve'}</button></div>
          <div className="counterparty-grid"><div className={trade?.buyerAllowanceTxHash?'mini-state complete':''}><span>Buyer allowance</span><b>{trade?.buyerAllowanceTxHash?'✓':'…'}</b></div><div className={trade?.sellerAllowanceTxHash?'mini-state complete':''}><span>Seller allowance</span><b>{trade?.sellerAllowanceTxHash?'✓':'…'}</b></div><div className={trade?.buyerApproved?'mini-state complete':''}><span>Buyer approval</span><b>{trade?.buyerApproved?'✓':'…'}</b></div><div className={trade?.sellerApproved?'mini-state complete':''}><span>Seller approval</span><b>{trade?.sellerApproved?'✓':'…'}</b></div></div>
          <div className={`action-row final-action ${trade?.status==='SETTLED'?'done':''}`}><div><b>4. Atomic DvP</b><small>{trade?.status==='SETTLED'?'Both legs settled':readyToSettle?'All prerequisites confirmed':'Waiting for both institutions'}</small></div><button disabled={!trade||!configured||!chainCompatible||role==='observer'||!!busy||!readyToSettle} className="btn btn-primary" onClick={()=>trade&&action('Atomic settlement','SETTLE',()=>settleOnchainTrade(settlement!,trade.id,account as `0x${string}`))}>{trade?.status==='SETTLED'?<CheckCircle2 size={14}/>:readyToSettle?<TimerReset size={14}/>:<LockKeyhole size={14}/>} {trade?.status==='SETTLED'?'Settled':readyToSettle?'Settle now':'Locked'}</button></div>
          {feedback&&<div className={feedback.toLowerCase().includes('failed')||feedback.toLowerCase().includes('could not')?'error':'success'}>{feedback}</div>}
          {lastTx&&<a className="btn btn-sm explorer-link" target="_blank" rel="noreferrer" href={explorerTx(lastTx)}>Open latest HSK transaction <ExternalLink size={12}/></a>}
        </div>
      </section>
    </div>
  </div>;
}
