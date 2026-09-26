'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, ShieldAlert } from 'lucide-react';
import { parseUnits } from 'viem';
import { WalletButton } from './WalletButton';
import { approveOnchainTrade, approveToken, createOnchainTrade, explorerTx, settleOnchainTrade } from '@/lib/onchain';
import { buildTradeAccessAuthorization } from '@/lib/auth-message';

type Trade = {
  id:string; buyerWallet:string; sellerWallet:string; quantity:number; paymentAmount:number; commitment:`0x${string}`;
  assetId:string; status:string; price:number; proofHash?:string;
};

const settlement = process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT as `0x${string}` | undefined;
const usdc = process.env.NEXT_PUBLIC_MOCK_USDC as `0x${string}` | undefined;
const rwa = process.env.NEXT_PUBLIC_MOCK_RWA as `0x${string}` | undefined;

function short(v:string) { return `${v.slice(0,8)}…${v.slice(-6)}`; }

export function SettlementWorkbench() {
  const [account,setAccount] = useState('');
  const [trades,setTrades] = useState<Trade[]>([]);
  const [selected,setSelected] = useState('');
  const [busy,setBusy] = useState('');
  const [lastTx,setLastTx] = useState('');
  const [feedback,setFeedback] = useState('');

  async function load(address:string) {
    if (!window.ethereum) throw new Error('MetaMask is required.');
    const requestId = crypto.randomUUID();
    const issuedAt = new Date().toISOString();
    const message = buildTradeAccessAuthorization(address, requestId, issuedAt);
    const signature: string = await window.ethereum.request({ method:'personal_sign', params:[message,address] });

    const r = await fetch('/api/trades/mine',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({walletAddress:address,requestId,issuedAt,signature}),
    });
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||'Could not load private trades');
    setTrades(j.trades||[]);
    if (!selected && j.trades?.[0]) setSelected(j.trades[0].id);
  }

  useEffect(()=>{
    if(account) {
      setFeedback('Sign once to reveal only trades involving this wallet.');
      load(account).then(()=>setFeedback('Private trade access verified.')).catch((e)=>setFeedback(e.message||'Trade access failed'));
    }
  },[account]);

  const trade = trades.find(t=>t.id===selected);
  const configured = Boolean(settlement && usdc && rwa);
  const current = account.toLowerCase();
  const role = trade ? current===trade.buyerWallet.toLowerCase()?'buyer':current===trade.sellerWallet.toLowerCase()?'seller':'observer' : 'observer';

  async function action(label:string,fn:()=>Promise<string>) {
    try { setBusy(label); setFeedback(''); const h=await fn(); setLastTx(h); setFeedback(`${label} transaction submitted.`); }
    catch(e:any){ setFeedback(e?.shortMessage || e?.message || `${label} failed`); }
    finally{ setBusy(''); }
  }

  return <div className="content-stack">
    <div className="topline"><div><span className="eyebrow">HSK Chain execution</span><h1 style={{marginTop:14}}>Atomic DvP settlement workbench</h1><p>Reveal only your matched trades, then move one into the functional VeilSettlement contract on HSK testnet.</p></div><WalletButton onAuthenticated={setAccount}/></div>

    {!configured && <div className="card" style={{borderColor:'rgba(255,212,121,.25)',marginBottom:16}}><div style={{display:'flex',gap:12}}><ShieldAlert color="#ffd479"/><div><b>HSK contracts are the final step</b><p>The cloud app and Supabase backend are live. Deploy the four public testnet contracts, then add their public addresses to the app configuration.</p></div></div></div>}

    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><div><div className="panel-title">My matched trades</div><div className="panel-sub">A wallet signature gates this private view</div></div><span className="badge green">{role.toUpperCase()}</span></div>
        <div className="table-wrap"><table><thead><tr><th>Trade</th><th>Qty</th><th>Payment</th><th>Commitment</th></tr></thead><tbody>{trades.length?trades.map(t=><tr key={t.id} onClick={()=>setSelected(t.id)} style={{cursor:'pointer',background:selected===t.id?'rgba(118,247,210,.04)':undefined}}><td className="mono">{short(t.id)}</td><td>{t.quantity.toLocaleString()} vTBILL</td><td>{t.paymentAmount.toLocaleString()} vUSDC</td><td className="mono muted">{short(t.commitment)}</td></tr>):<tr><td colSpan={4} className="empty-cell">Connect a participant wallet and sign the access message to load its private matched trades.</td></tr>}</tbody></table></div>
      </section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Execution sequence</div><div className="panel-sub">HSK testnet chain ID 133</div></div></div>
        <div className="form">
          <label className="label">1. Approve settlement token allowance</label>
          <button disabled={!trade||!configured||role==='observer'||!!busy} className="btn" style={{width:'100%'}} onClick={()=>trade && action('Token approval',()=>approveToken(role==='buyer'?usdc!:rwa!,settlement!,role==='buyer'?parseUnits(String(trade.paymentAmount),6):parseUnits(String(trade.quantity),18),account as `0x${string}`))}>{busy==='Token approval'?<Loader2 size={14}/>:`Approve ${role==='buyer'?'vUSDC':'vTBILL'}`}</button>
          <label className="label">2. Anchor matched trade on HSK</label>
          <button disabled={!trade||!configured||role==='observer'||!!busy} className="btn" style={{width:'100%'}} onClick={()=>trade && action('Create trade',()=>createOnchainTrade({settlement:settlement!,id:trade.id,buyer:trade.buyerWallet as `0x${string}`,seller:trade.sellerWallet as `0x${string}`,assetAmount:parseUnits(String(trade.quantity),18),paymentAmount:parseUnits(String(trade.paymentAmount),6),commitment:trade.commitment,account:account as `0x${string}`}))}>Create settlement instruction</button>
          <label className="label">3. Counterparty approvals</label>
          <button disabled={!trade||!configured||role==='observer'||!!busy} className="btn" style={{width:'100%'}} onClick={()=>trade && action('Trade approval',()=>approveOnchainTrade(settlement!,trade.id,account as `0x${string}`))}>Approve as {role}</button>
          <label className="label">4. Atomic DvP</label>
          <button disabled={!trade||!configured||role==='observer'||!!busy} className="btn btn-primary" style={{width:'100%'}} onClick={()=>trade && action('Settlement',()=>settleOnchainTrade(settlement!,trade.id,account as `0x${string}`))}><CheckCircle2 size={14}/> Settle both legs atomically</button>
          {feedback && <div className={feedback.includes('failed')||feedback.includes('Could not')?'error':'success'}>{feedback}</div>}
          {lastTx && <a className="btn btn-sm" style={{marginTop:12,display:'inline-block'}} target="_blank" href={explorerTx(lastTx)}>Open HSK explorer <ExternalLink size={12}/></a>}
        </div>
      </section>
    </div>
  </div>;
}
