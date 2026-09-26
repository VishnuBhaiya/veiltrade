'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Coins, Droplets, Landmark, RefreshCw, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { AppChrome } from './AppChrome';

type Balance = {
  assetId:string;
  symbol:string;
  name:string;
  assetType:'RWA'|'STABLECOIN';
  indicativePrice:number;
  balance:number;
  updatedAt:string;
};

const number = new Intl.NumberFormat('en-AU',{maximumFractionDigits:2});
const usd = new Intl.NumberFormat('en-AU',{style:'currency',currency:'USD',maximumFractionDigits:0});
const tone=(s:string)=>s==='vTBILL'?'aqua':s==='vMMF'?'violet':s==='vBOND'?'amber':'blue';

export function PortfolioView(){
  const [wallet,setWallet]=useState('');
  const [rows,setRows]=useState<Balance[]>([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function load(){
    if(!wallet) return;
    const r=await fetch('/api/portfolio',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||'Could not load demo portfolio');
    setRows(j.balances||[]);
  }

  async function onAuthenticated(address:string){
    setWallet(address);
    setMessage('Loading sandbox balances…');
    try{
      const r=await fetch('/api/portfolio',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Could not load demo portfolio');
      setRows(j.balances||[]);
      setMessage('Demo portfolio connected.');
    }catch(e:any){setMessage(e.message||'Could not load demo portfolio')}
  }

  async function faucet(){
    try{
      setBusy(true);setMessage('Topping up demo assets…');
      const r=await fetch('/api/portfolio/faucet',{method:'POST'});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Demo faucet failed');
      setRows(j.balances||[]);
      setMessage('Demo assets ready — portfolio topped up to safe sandbox levels.');
    }catch(e:any){setMessage(e.message||'Demo faucet failed')}
    finally{setBusy(false)}
  }

  const rwa=rows.filter(r=>r.assetType==='RWA');
  const cash=rows.find(r=>r.symbol==='vUSDC');
  const rwaValue=useMemo(()=>rwa.reduce((s,r)=>s+r.balance*r.indicativePrice,0),[rwa]);
  const total=useMemo(()=>rwaValue+(cash?.balance||0),[rwaValue,cash]);

  return <AppChrome onAuthenticated={onAuthenticated}>
    <section className="page-hero compact-hero">
      <div>
        <div className="page-kicker"><WalletCards size={14}/> DEMO INSTITUTIONAL PORTFOLIO</div>
        <h1>Wallet inventory</h1>
        <p>See the assets your demo institution can trade, top up sandbox inventory, and move directly into a private fund market.</p>
      </div>
      <div className="hero-actions-row">
        <span className="badge violet"><ShieldCheck size={11}/> SANDBOX BALANCES</span>
        <button className="btn" onClick={()=>load().catch(e=>setMessage(e.message))} disabled={!wallet||busy}><RefreshCw size={14}/> Refresh</button>
        <button className="btn btn-primary" onClick={faucet} disabled={!wallet||busy}><Droplets size={14}/> {busy?'Funding…':'Get demo assets'}</button>
      </div>
    </section>

    <div className="portfolio-hero">
      <div>
        <span>Portfolio value</span>
        <strong>{usd.format(total)}</strong>
        <small>Indicative demo value · not real funds</small>
      </div>
      <div className="portfolio-stat"><span>Settlement cash</span><b>{number.format(cash?.balance||0)} vUSDC</b></div>
      <div className="portfolio-stat"><span>RWA value</span><b>{usd.format(rwaValue)}</b></div>
      <div className="portfolio-stat"><span>Markets held</span><b>{rwa.filter(r=>r.balance>0).length}</b></div>
    </div>

    {message&&<div className={message.toLowerCase().includes('failed')||message.toLowerCase().includes('could not')?'error':'verified-banner portfolio-message'}><Sparkles size={15}/><div><b>{message}</b><span>{wallet?'Authenticated wallet inventory':'Connect your wallet to continue.'}</span></div></div>}

    <div className="portfolio-grid">
      {rows.map((r,i)=><article key={r.assetId} className={`portfolio-card fund-${tone(r.symbol)}`}>
        <div className="portfolio-card-top">
          <span className="portfolio-token-icon">{r.symbol==='vUSDC'?<Coins size={20}/>:<Landmark size={20}/>}</span>
          <span className={`fund-pill mini fund-${tone(r.symbol)}`}>{r.assetType}</span>
        </div>
        <span className="portfolio-symbol">{r.symbol}</span>
        <h3>{r.name}</h3>
        <strong>{number.format(r.balance)}</strong>
        <div className="portfolio-value">{r.symbol==='vUSDC'?usd.format(r.balance):usd.format(r.balance*r.indicativePrice)}</div>
        <div className="portfolio-foot">
          <span><small>Indicative price</small><b>{r.symbol==='vUSDC'?'$1.00':`$${r.indicativePrice.toFixed(2)}`}</b></span>
          {r.assetType==='RWA'?<Link href="/app" className="table-action">Trade <ArrowRight size={12}/></Link>:<span className="badge green">Settlement asset</span>}
        </div>
      </article>)}
      {!rows.length&&<div className="panel portfolio-empty">
        <div className="portfolio-token-icon"><WalletCards size={22}/></div>
        <h3>{wallet?'Fund your demo portfolio':'Connect your wallet'}</h3>
        <p>{wallet?'Use “Get demo assets” to provision vUSDC and three tokenized RWA positions for the hackathon walkthrough.':'One wallet sign-in unlocks portfolio, trading and private match access for 12 hours.'}</p>
      </div>}
    </div>

    <div className="portfolio-note">
      <ShieldCheck size={17}/>
      <div><b>Demo sandbox, clearly separated from on-chain settlement.</b><span>These balances are presentation inventory stored in the demo backend. Actual HSK settlement uses wallet-approved token transactions once deployed contract addresses are configured.</span></div>
    </div>
  </AppChrome>;
}
