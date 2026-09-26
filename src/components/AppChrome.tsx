'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ArrowDownUp, Blocks, BookOpen, FileKey2, Presentation, Rocket, ShieldCheck, Sparkles, WalletCards, X } from 'lucide-react';
import { Brand } from './Brand';
import { WalletButton } from './WalletButton';

const items = [
  { href: '/app', label: 'Markets', icon: Activity },
  { href: '/orderbook', label: 'Order books', icon: BookOpen },
  { href: '/matches', label: 'Matches', icon: ArrowDownUp },
  { href: '/portfolio', label: 'Portfolio', icon: WalletCards },
  { href: '/deploy', label: 'HSK launchpad', icon: Rocket },
  { href: '/settlement', label: 'HSK settlement', icon: Blocks },
  { href: '/regulator', label: 'Regulator view', icon: FileKey2 },
  { href: '/admin', label: 'Compliance & funds', icon: ShieldCheck },
];

const demoSteps = [
  ['1','Connect once','Wallet sign-in creates a 12-hour VeilTrade session.'],
  ['2','Choose a fund','Switch between vTBILL, vMMF and vBOND isolated markets.'],
  ['3','Fund the sandbox','Portfolio → Get demo assets provisions presentation inventory.'],
  ['4','Create exact orders','Two different wallets use the same fund, price and quantity on opposite sides.'],
  ['5','Watch auto-match','The second order instantly creates a private match — no manual matcher button.'],
  ['6','Show privacy','Matches expose commitments; Regulator View selectively reveals the protected record.'],
  ['7','Go on-chain','HSK Launchpad deploys the vTBILL/vUSDC DvP stack with one wallet-approved testnet transaction.'],
];

export function AppChrome({ children, showWallet = true, onAuthenticated }: { children: ReactNode; showWallet?: boolean; onAuthenticated?: (address: string) => void; }) {
  const pathname = usePathname();
  const [walkthrough,setWalkthrough]=useState(false);

  return <div className="app-shell">
    <header className="app-nav">
      <Brand/>
      <div className="nav-actions">
        <button className="btn btn-sm walkthrough-trigger" onClick={()=>setWalkthrough(true)}><Presentation size={14}/> Demo walkthrough</button>
        <span className="network-pill"><span className="network-dot"/> HSK Testnet · 133</span>
        {showWallet&&<WalletButton onAuthenticated={onAuthenticated}/>}
      </div>
    </header>
    <div className="app-grid">
      <aside className="sidebar">
        <div className="sidebar-label">Institutional workspace</div>
        <nav className="sidebar-nav">{items.map(({href,label,icon:Icon})=>{
          const active=pathname===href;
          return <Link key={href} href={href} className={'side-link '+(active?'active':'')}><span className="side-icon"><Icon size={17}/></span><span>{label}</span>{active&&<span className="active-dot"/>}</Link>
        })}</nav>
        <button className="sidebar-demo-card sidebar-demo-button" onClick={()=>setWalkthrough(true)}>
          <div className="sidebar-demo-title"><Sparkles size={14}/> 3-minute demo</div>
          <div className="demo-mini-step"><b>1</b><span>Choose tokenized fund</span></div>
          <div className="demo-mini-step"><b>2</b><span>Create private intent</span></div>
          <div className="demo-mini-step"><b>3</b><span>Auto-match</span></div>
          <div className="demo-mini-step"><b>4</b><span>Reveal / HSK settle</span></div>
          <span className="sidebar-demo-cta">Open walkthrough →</span>
        </button>
        <div className="sidebar-footnote"><b>Multi-asset privacy infrastructure</b><span>Cloud-private markets plus a real vTBILL/vUSDC HSK DvP demo path.</span></div>
      </aside>
      <main className="main">{children}</main>
    </div>

    {walkthrough&&<div className="walkthrough-backdrop" onMouseDown={()=>setWalkthrough(false)}>
      <div className="walkthrough-modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="walkthrough-head"><div><span className="eyebrow"><Sparkles size={13}/> JUDGE MODE</span><h2>VeilTrade in 3 minutes</h2><p>Follow this exact path for the cleanest end-to-end story.</p></div><button className="icon-button" onClick={()=>setWalkthrough(false)}><X size={18}/></button></div>
        <div className="walkthrough-steps">{demoSteps.map(([n,title,body])=><div className="walkthrough-step" key={n}><b>{n}</b><div><strong>{title}</strong><span>{body}</span></div></div>)}</div>
        <div className="walkthrough-actions"><Link href="/portfolio" className="btn" onClick={()=>setWalkthrough(false)}>Start with portfolio</Link><Link href="/app" className="btn btn-primary" onClick={()=>setWalkthrough(false)}>Start demo <Presentation size={14}/></Link></div>
      </div>
    </div>}
  </div>;
}
