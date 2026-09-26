'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CheckCircle2, ExternalLink, Loader2, LockKeyhole, RefreshCw, ShieldAlert, TimerReset } from 'lucide-react';
import { parseUnits } from 'viem';
import { WalletButton } from './WalletButton';
import { approveOnchainTrade, approveToken, createOnchainTrade, explorerTx, settleOnchainTrade, waitForHskTransaction } from '@/lib/onchain';
import { buildTradeAccessAuthorization, isFresh } from '@/lib/auth-message';

type Trade = {
  id:string; buyerWallet:string; sellerWallet:string; quantity:number; paymentAmount:number; commitment:`0x${string}`;
  assetId:string; status:string; price:number; proofHash?:string; txHash?:string;
  buyerAllowanceTxHash?:string; sellerAllowanceTxHash?:string; anchoredTxHash?:string;
  buyerApproved?:boolean; sellerApproved?:boolean; settlementTxHash?:string;
};
type AccessAuth={requestId:string;issuedAt:string;signature:string};

const settlement = process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT as `0x${string}` | undefined;
const usdc = process.env.NEXT_PUBLIC_MOCK_USDC as `0x${string}` | undefined;
const rwa = process.env.NEXT_PUBLIC_MOCK_RWA as `0x${string}` | undefined;

function short(v:string) { return v?`${v.slice(0,8)}…${v.slice(-6)}`:'—'; }

export function SettlementWorkbench() {
  const [account,setAccount] = useState('');
  const [trades,setTrades] = useState<Trade[]>([]);
  const [selected,setSelected] = useState('');
  const [busy,setBusy] = useState('');
  const [lastTx,setLastTx] = useState('');
  const [feedback,setFeedback] = useState('');
  const [access,setAccess] = useState<AccessAuth|null>(null);

  async function authorize(address:string):Promise<AccessAuth>{
    if (!window.ethereum) throw new Error('MetaMask is required.');
    const requestId=crypto.randomUUID();
    const issuedAt=new Date().toISOString();
    const message=buildTradeAccessAuthorization(address,requestId,issuedAt);
    const signature:string=await window.ethereum.request({method:'personal_sign',params:[message,address]});
    const next={requestId,issuedAt,signature};
    setAccess(next);
    return next;
  }

  async function load(address=account, auth=access){
    if(!address) return;
    let current=auth;
    if(!current||!isFresh(current.issuedAt)) current=await authorize(address);
    const r=await fetch('/api/trades/mine',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({walletAddress:address,...current}),
    });
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||'Could not load private trades');
    setTrades(j.trades||[]);
    setSelected(prev=>prev&&j.trades?.some((t:Trade)=>t.id===prev)?prev:(j.trades?.[0]?.id||''));
  }

  useEffect(()=>{
    if(account){
      setFeedback('Sign the private-access message once to reveal only trades involving this wallet.');
      load(account,null).then(()=>setFeedback('Private trade access verified.')).catch((e)=>setFeedback(e.message||'Trade access failed'));
    }
  },[account]);

  const trade=trades.find(t=>t.id===selected);
  const configured=Boolean(settlement&&usdc&&rwa);
  const current=account.toLowerCase();
  const role=trade?current===trade.buyerWallet.toLowerCase()?'buyer':current===trade.sellerWallet.toLowerCase()?'seller':'observer':'observer';
  const myAllowance=trade?(role==='buyer'?trade.buyerAllowanceTxHash:role==='seller'?trade.sellerAllowanceTxHash:undefined):undefined;
  const myApproval=trade?(role==='buyer'?trade.buyerApproved:role==='seller'?trade.sellerApproved:false):false;
  const bothAllowances=Boolean(trade?.buyerAllowanceTxHash&&trade?.sellerAllowanceTxHash);
  const bothApproved=Boolean(trade?.buyerApproved&&trade?.sellerApproved);
  const readyToSettle=Boolean(trade?.anchoredTxHash&&bothAllowances&&bothApproved&&trade?.status!=='SETTLED');

  const stage=useMemo(()=>{
    if(!trade) return 0;
    if(trade.status==='SETTLED'||trade.settlementTxHash) return 5;
    if(bothApproved&&bothAllowances&&trade.anchoredTxHash) return 4;
    if(trade.buyerApproved||trade.sellerApproved) return 3;
    if(trade.anchoredTxHash) return 2;
    if(trade.buyerAllowanceTxHash||trade.sellerAllowanceTxHash) return 1;
    return 0;
  },[trade,bothApproved,bothAllowances]);

  async function persist(action:'ALLOWANCE'|'ANCHOR'|'APPROVE'|'SETTLE',hash:`0x${string}`){
    if(!trade||!account) return;
    const r=await fetch(`/api/trades/${trade.id}/progress`,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({walletAddress:account,action,txHash:hash}),
    });
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||'Could not persist settlement progress');
    setTrades(prev=>prev.map(t=>t.id===trade.id?{...t,...j.trade}:t));
  }

  async function action(label:string,kind:'ALLOWANCE'|'ANCHOR'|'APPROVE'|'SETTLE',fn:()=>Promise<`0x${string}`>){
    try{
      setBusy(label);setFeedback(`${label}: waiting for wallet confirmation…`);
      const hash=await fn();
      setLastTx(hash);
      setFeedback(`${label}: submitted to HSK, waiting for confirmation…`);
      await waitForHskTransaction(hash);
      setFeedback(`${label}: confirmed on HSK, saving lifecycle progress…`);
      await persist(kind,hash);
      setFeedback(`${label} confirmed and recorded.`);
    }catch(e:any){
      setFeedback(e?.shortMessage||e?.message||`${label} failed`);
    }finally{setBusy('')}
  }

  return <div className="content-stack">
    <div className="topline">
      <div><span className="eyebrow">HSK Chain execution</span><h1 style={{marginTop:14}}>Atomic DvP settlement</h1><p>A guided lifecycle that waits for HSK confirmation and persists each completed step.</p></div>
      <WalletButton onAuthenticated={setAccount}/>
    </div>

    {!configured&&<div className="verified-banner warning-banner"><ShieldAlert size={18}/><div><b>Contracts not deployed yet</b><span>The cloud workflow is ready. Once the public HSK contract addresses are added, these steps become live transactions.</span></div></div>}

    <div className="settlement-stepper">
      {[
        ['Allowance','Token spend approved'],
        ['Anchor','Trade instruction on HSK'],
        ['Approvals','Buyer + seller consent'],
        ['Ready','Both sides complete'],
        ['Settled','Atomic DvP confirmed'],
      ].map((item,i)=><div key={item[0]} className={`settlement-step ${stage>i?'complete':''} ${stage===i?'current':''}`}>
        <span className="step-index">{stage>i?<BadgeCheck size={14}/>:i+1}</span><span><b>{item[0]}</b><small>{item[1]}</small></span>
      </div>)}
    </div>

    <div className="dashboard-grid settlement-grid">
      <section className="panel premium-panel">
        <div className="panel-head"><div><div className="panel-title">My matched trades</div><div className="panel-sub">Wallet-signed access reveals only trades where this wallet is a counterparty</div></div><button className="btn btn-sm" onClick={()=>load().catch(e=>setFeedback(e.message))} disabled={!account||!!busy}><RefreshCw size={13}/> Refresh</button></div>
        <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Qty</th><th>Payment</th><th>Status</th><th>Commitment</th></tr></thead><tbody>
          {trades.length?trades.map(t=><tr key={t.id} onClick={()=>setSelected(t.id)} className={selected===t.id?'selected-row':''} style={{cursor:'pointer'}}>
            <td className="mono">{short(t.id)}</td><td>{t.quantity.toLocaleString()} vTBILL</td><td>{t.paymentAmount.toLocaleString()} vUSDC</td><td><span className={`badge ${t.status==='SETTLED'?'green':t.status==='READY'?'violet':'blue'}`}>{t.status}</span></td><td className="mono muted">{short(t.commitment)}</td>
          </tr>):<tr><td colSpan={5} className="empty-cell">Connect a participant wallet and sign the access message to reveal its private matched trades.</td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel settlement-control">
        <div className="panel-head"><div><div className="panel-title">Execution control</div><div className="panel-sub">{trade?`Role: ${role.toUpperCase()} · Trade ${short(trade.id)}`:'Select a matched trade'}</div></div><span className={`badge ${readyToSettle?'green':'orange'}`}>{readyToSettle?'READY':'SEQUENCED'}</span></div>
        <div className="form settlement-actions">
          <div className={`action-row ${myAllowance?'done':''}`}><div><b>1. Token allowance</b><small>{myAllowance?`Confirmed ${short(myAllowance)}`:`Approve ${role==='buyer'?'vUSDC':'vTBILL'} spending`}</small></div><button disabled={!trade||!configured||role==='observer'||!!busy||!!myAllowance} className="btn" onClick={()=>trade&&action('Token allowance','ALLOWANCE',()=>approveToken(role==='buyer'?usdc!:rwa!,settlement!,role==='buyer'?parseUnits(String(trade.paymentAmount),6):parseUnits(String(trade.quantity),18),account as `0x${string}`))}>{myAllowance?<CheckCircle2 size={14}/>:busy==='Token allowance'?<Loader2 size={14}/>:null}{myAllowance?'Confirmed':'Approve'}</button></div>

          <div className={`action-row ${trade?.anchoredTxHash?'done':''}`}><div><b>2. Anchor trade</b><small>{trade?.anchoredTxHash?`Confirmed ${short(trade.anchoredTxHash)}`:'Create the matched trade instruction on HSK'}</small></div><button disabled={!trade||!configured||role==='observer'||!!busy||!myAllowance||!!trade?.anchoredTxHash} className="btn" onClick={()=>trade&&action('Trade anchor','ANCHOR',()=>createOnchainTrade({settlement:settlement!,id:trade.id,buyer:trade.buyerWallet as `0x${string}`,seller:trade.sellerWallet as `0x${string}`,assetAmount:parseUnits(String(trade.quantity),18),paymentAmount:parseUnits(String(trade.paymentAmount),6),commitment:trade.commitment,account:account as `0x${string}`}))}>{trade?.anchoredTxHash?'Anchored':'Anchor'}</button></div>

          <div className={`action-row ${myApproval?'done':''}`}><div><b>3. Counterparty approval</b><small>{myApproval?`${role} approval confirmed`:trade?.anchoredTxHash?`Approve as ${role}`:'Waiting for anchor'}</small></div><button disabled={!trade||!configured||role==='observer'||!!busy||!trade?.anchoredTxHash||!!myApproval} className="btn" onClick={()=>trade&&action('Trade approval','APPROVE',()=>approveOnchainTrade(settlement!,trade.id,account as `0x${string}`))}>{myApproval?'Approved':'Approve'}</button></div>

          <div className="counterparty-grid">
            <div className={trade?.buyerAllowanceTxHash?'mini-state complete':''}><span>Buyer allowance</span><b>{trade?.buyerAllowanceTxHash?'✓':'…'}</b></div>
            <div className={trade?.sellerAllowanceTxHash?'mini-state complete':''}><span>Seller allowance</span><b>{trade?.sellerAllowanceTxHash?'✓':'…'}</b></div>
            <div className={trade?.buyerApproved?'mini-state complete':''}><span>Buyer approval</span><b>{trade?.buyerApproved?'✓':'…'}</b></div>
            <div className={trade?.sellerApproved?'mini-state complete':''}><span>Seller approval</span><b>{trade?.sellerApproved?'✓':'…'}</b></div>
          </div>

          <div className={`action-row final-action ${trade?.status==='SETTLED'?'done':''}`}><div><b>4. Atomic DvP</b><small>{trade?.status==='SETTLED'?'Both legs settled':readyToSettle?'All prerequisites confirmed':'Waiting for both institutions'}</small></div><button disabled={!trade||!configured||role==='observer'||!!busy||!readyToSettle} className="btn btn-primary" onClick={()=>trade&&action('Atomic settlement','SETTLE',()=>settleOnchainTrade(settlement!,trade.id,account as `0x${string}`))}>{trade?.status==='SETTLED'?<CheckCircle2 size={14}/>:readyToSettle?<TimerReset size={14}/>:<LockKeyhole size={14}/>} {trade?.status==='SETTLED'?'Settled':readyToSettle?'Settle now':'Locked'}</button></div>

          {feedback&&<div className={feedback.toLowerCase().includes('failed')||feedback.toLowerCase().includes('could not')?'error':'success'}>{feedback}</div>}
          {lastTx&&<a className="btn btn-sm explorer-link" target="_blank" rel="noreferrer" href={explorerTx(lastTx)}>Open latest HSK transaction <ExternalLink size={12}/></a>}
        </div>
      </section>
    </div>
  </div>;
}
