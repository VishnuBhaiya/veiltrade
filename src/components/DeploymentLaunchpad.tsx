'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Boxes, Coins, ExternalLink, Fuel, Landmark, Rocket, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { claimDemoAssetsOnchain, deployDemoBootstrap, explorerAddress, explorerTx, hasClaimedDemoAssets, waitForHskTransaction } from '@/lib/onchain';

type Deployment={
  bootstrapAddress:string; settlementAddress:string; usdcAddress:string; rwaAddress:string;
  registryAddress:string; deployerWallet:string; txHash:string; createdAt?:string;
};

const short=(v:string)=>v?`${v.slice(0,8)}…${v.slice(-6)}`:'—';

export function DeploymentLaunchpad(){
  const [account,setAccount]=useState('');
  const [deployment,setDeployment]=useState<Deployment|null>(null);
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [claimed,setClaimed]=useState<boolean|null>(null);

  async function load(){
    const r=await fetch('/api/deployment',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||'Could not load HSK deployment state');
    setDeployment(j.deployment||null);
    return j.deployment as Deployment|null;
  }

  useEffect(()=>{load().catch(e=>setMessage(e.message))},[]);

  async function onAuthenticated(address:string){
    setAccount(address);
    try{
      const d=deployment||await load();
      if(d) setClaimed(await hasClaimedDemoAssets(d.bootstrapAddress as `0x${string}`,address as `0x${string}`));
    }catch{setClaimed(null)}
  }

  async function deploy(){
    if(!account) return;
    try{
      setBusy('deploy');
      setMessage('Approve one HSK contract deployment in MetaMask…');
      const result=await deployDemoBootstrap(account as `0x${string}`);
      setMessage('Deployment confirmed. Verifying the stack and registering public addresses…');
      const r=await fetch('/api/deployment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        bootstrapAddress:result.address,
        txHash:result.hash,
      })});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Could not register deployment');
      setDeployment(j.deployment);
      setClaimed(true);
      setMessage('HSK demo stack is live. Settlement can now use the deployed vTBILL/vUSDC contracts.');
    }catch(e:any){setMessage(e?.shortMessage||e?.message||'HSK deployment failed')}
    finally{setBusy('')}
  }

  async function claim(){
    if(!account||!deployment) return;
    try{
      setBusy('claim');
      setMessage('Approve the HSK demo-token claim in MetaMask…');
      const hash=await claimDemoAssetsOnchain(deployment.bootstrapAddress as `0x${string}`,account as `0x${string}`);
      await waitForHskTransaction(hash);
      setClaimed(true);
      setMessage('HSK testnet wallet provisioned: 1,000,000 vUSDC + 100,000 vTBILL + eligibility.');
    }catch(e:any){setMessage(e?.shortMessage||e?.message||'Claim failed')}
    finally{setBusy('')}
  }

  const isDeployer=useMemo(()=>Boolean(account&&deployment&&account.toLowerCase()===deployment.deployerWallet.toLowerCase()),[account,deployment]);

  return <div className="content-stack">
    <div className="topline">
      <div><span className="eyebrow"><Rocket size={14}/> HSK TESTNET LAUNCHPAD</span><h1 style={{marginTop:14}}>Deploy the settlement stack</h1><p>One MetaMask deployment creates the demo vUSDC, vTBILL, eligibility registry and atomic DvP contract. No private key ever leaves your wallet.</p></div>
      <WalletButton onAuthenticated={onAuthenticated}/>
    </div>

    <div className={`launch-status ${deployment?'live':'pending'}`}>
      <span className="launch-status-icon">{deployment?<BadgeCheck size={22}/>:<Rocket size={22}/>}</span>
      <div><b>{deployment?'HSK settlement stack registered':'Ready for one-click HSK deployment'}</b><span>{deployment?'Public testnet addresses are verified from the deployment receipt and shared with the settlement workbench.':'Connect the funded hackathon wallet, then approve one contract-creation transaction.'}</span></div>
      <span className={`badge ${deployment?'green':'orange'}`}>{deployment?'LIVE':'NOT DEPLOYED'}</span>
    </div>

    {!deployment?<div className="launch-grid">
      <section className="panel launch-main">
        <div className="launch-orbit"><Rocket size={34}/></div>
        <span className="eyebrow">One transaction bootstrap</span>
        <h2>Turn the cloud demo into a real HSK settlement demo.</h2>
        <p>The bootstrap deploys the functional contracts from your connected wallet and automatically gives that deployer vUSDC, vTBILL and testnet eligibility.</p>
        <button className="btn btn-primary launch-button" onClick={deploy} disabled={!account||!!busy}><Rocket size={16}/> {busy==='deploy'?'Deploying on HSK…':'Deploy HSK demo stack'}</button>
        {!account&&<small>Connect & sign in first. You will need a small amount of HSK testnet gas.</small>}
      </section>
      <section className="panel launch-checklist">
        <div className="panel-title">What gets deployed</div>
        <div className="launch-item"><Coins size={18}/><span><b>vUSDC</b><small>6-decimal mock settlement currency</small></span></div>
        <div className="launch-item"><Landmark size={18}/><span><b>vTBILL</b><small>18-decimal tokenized treasury demo asset</small></span></div>
        <div className="launch-item"><ShieldCheck size={18}/><span><b>Eligibility Registry</b><small>Compliance gate re-checked at settlement</small></span></div>
        <div className="launch-item"><Boxes size={18}/><span><b>VeilSettlement</b><small>Atomic RWA ↔ stablecoin delivery-versus-payment</small></span></div>
      </section>
    </div>:<>
      <div className="deployment-address-grid">
        {[
          ['Bootstrap',deployment.bootstrapAddress,'One-transaction demo factory'],
          ['VeilSettlement',deployment.settlementAddress,'Atomic DvP'],
          ['vUSDC',deployment.usdcAddress,'Settlement currency'],
          ['vTBILL',deployment.rwaAddress,'Tokenized treasury asset'],
          ['Eligibility',deployment.registryAddress,'Compliance registry'],
        ].map(([label,address,desc])=><a key={label} href={explorerAddress(address)} target="_blank" rel="noreferrer" className="deployment-address-card">
          <span>{label}</span><b className="mono">{short(address)}</b><small>{desc}</small><ExternalLink size={12}/>
        </a>)}
      </div>

      <div className="launch-grid">
        <section className="panel">
          <div className="panel-head"><div><div className="panel-title"><Users size={16}/> Counterparty provisioning</div><div className="panel-sub">Each demo wallet can claim testnet inventory once</div></div><span className={`badge ${claimed?'green':'blue'}`}>{claimed?'CLAIMED':'AVAILABLE'}</span></div>
          <div className="form">
            <p className="launch-copy">Use this with the second MetaMask account before the two-party settlement demo. The claim grants eligibility plus <b>1,000,000 vUSDC</b> and <b>100,000 vTBILL</b>.</p>
            <button className="btn btn-primary" style={{width:'100%'}} onClick={claim} disabled={!account||!!busy||claimed===true}><Fuel size={15}/> {claimed?'Wallet provisioned':busy==='claim'?'Claiming on HSK…':'Claim HSK demo assets'}</button>
            {isDeployer&&<div className="success">The deployment transaction already provisioned this deployer wallet.</div>}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><div className="panel-title">Deployment proof</div><div className="panel-sub">Verified HSK testnet transaction</div></div><span className="badge green"><Sparkles size={11}/> CHAIN 133</span></div>
          <div className="form">
            <div className="proof-line"><span>Deployer</span><b className="mono">{short(deployment.deployerWallet)}</b></div>
            <div className="proof-line"><span>Transaction</span><b className="mono">{short(deployment.txHash)}</b></div>
            <a className="btn" style={{width:'100%',marginTop:13}} href={explorerTx(deployment.txHash)} target="_blank" rel="noreferrer">Open HSK explorer <ExternalLink size={13}/></a>
          </div>
        </section>
      </div>
    </>}

    {message&&<div className={message.toLowerCase().includes('failed')||message.toLowerCase().includes('could not')?'error launch-message':'verified-banner launch-message'}><Sparkles size={15}/><div><b>{message}</b><span>HSK testnet · no production funds</span></div></div>}

    <div className="portfolio-note">
      <ShieldCheck size={17}/><div><b>Hackathon/testnet helper only.</b><span>The launchpad deliberately provisions mock assets for a live DvP demonstration. It does not make the standard ERC-20 settlement private; those transfers remain visible on-chain.</span></div>
    </div>
  </div>;
}
