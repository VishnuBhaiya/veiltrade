import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, EyeOff, Landmark, LockKeyhole, Scale, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Brand } from '@/components/Brand';

const markets=[
  {symbol:'vTBILL',name:'Tokenized Treasury Fund',price:'$10.11',tone:'aqua',detail:'Short-duration treasury exposure'},
  {symbol:'vMMF',name:'Money Market Fund',price:'$25.40',tone:'violet',detail:'Institutional liquidity strategy'},
  {symbol:'vBOND',name:'Investment Grade Bond Fund',price:'$48.75',tone:'amber',detail:'Diversified tokenized credit'},
];

export default function Home(){
  return <main className="landing">
    <div className="shell">
      <nav className="nav">
        <Brand/>
        <div className="nav-links"><a href="#markets">Markets</a><a href="#architecture">Architecture</a><a href="#privacy">Privacy</a></div>
        <div className="nav-actions"><Link className="btn" href="/regulator">Regulator view</Link><Link className="btn btn-primary" href="/app">Open VeilTrade</Link></div>
      </nav>

      <section className="hero landing-hero">
        <div>
          <span className="eyebrow"><Sparkles size={14}/> CONFIDENTIAL RWA MARKET INFRASTRUCTURE</span>
          <h1><span className="gradient-text">Private markets for tokenized real-world assets.</span></h1>
          <p className="landing-subtitle">Trade confidentially. Settle atomically. Disclose selectively.</p>
          <p>VeilTrade separates sensitive institutional intent from the information a public blockchain actually needs to verify — with multi-fund markets, cryptographic commitments, compliance controls and an HSK settlement path.</p>
          <div className="hero-actions"><Link href="/app" className="btn btn-primary">Enter private markets <ArrowRight size={16}/></Link><Link href="/portfolio" className="btn">Open demo portfolio</Link></div>
          <div className="hero-proof"><span>Multi-fund RWA markets</span><span>Exact auto-match</span><span>Selective disclosure</span><span>HSK testnet ready</span></div>
        </div>

        <div className="landing-prism">
          <div className="prism-orbit orbit-one"/><div className="prism-orbit orbit-two"/>
          <div className="prism-card prism-main">
            <div className="trade-top"><div><small>PRIVATE MARKET INSTRUCTION</small><b>vTBILL / vUSDC</b></div><span className="status"><CheckCircle2 size={12}/> verified</span></div>
            <div className="prism-flow"><div><small>Institution A</small><strong>BUY</strong><span>identity hidden</span></div><ArrowRight size={18}/><div><small>Commitment</small><strong>0x9F…A2</strong><span>public proof anchor</span></div><ArrowRight size={18}/><div><small>Institution B</small><strong>SELL</strong><span>identity hidden</span></div></div>
            <div className="proof-grid"><div className="proof-cell">Counterparty policy<b>Eligible ✓</b></div><div className="proof-cell">Settlement mode<b>Atomic DvP</b></div><div className="proof-cell">Public amount<b>PRIVATE</b></div><div className="proof-cell">Regulator access<b>Selective</b></div></div>
          </div>
          <div className="floating-chip chip-one"><LockKeyhole size={14}/> confidential intent</div>
          <div className="floating-chip chip-two"><ShieldCheck size={14}/> compliance aware</div>
        </div>
      </section>

      <section className="section" id="markets">
        <div className="section-head"><span className="eyebrow">Live demo markets</span><h2>One privacy layer. Multiple tokenized funds.</h2><p>Each fund has an isolated order book and match stream while vUSDC acts as the common settlement currency.</p></div>
        <div className="landing-market-grid">
          {markets.map((m,i)=><Link href="/app" key={m.symbol} className={`landing-market-card market-${m.tone}`}>
            <div className="landing-market-top"><span className="market-logo">{i===0?<Landmark size={18}/>:<Building2 size={18}/>}</span><span className="market-live"><span/> ACTIVE</span></div>
            <strong>{m.symbol}<small>/ vUSDC</small></strong><h3>{m.name}</h3><p>{m.detail}</p><div><b>{m.price}</b><span>Open market <ArrowRight size={12}/></span></div>
          </Link>)}
        </div>
      </section>

      <section className="section" id="architecture">
        <div className="section-head"><span className="eyebrow">Three layers</span><h2>A market workflow built around minimum necessary disclosure.</h2></div>
        <div className="grid-3">
          <div className="card"><div className="icon-chip"><EyeOff size={18}/></div><h3>Private market layer</h3><p>Wallet-authenticated institutions submit committed order intent into isolated fund markets without publishing institution identity.</p></div>
          <div className="card"><div className="icon-chip"><Workflow size={18}/></div><h3>Automatic matching layer</h3><p>Exact opposite orders match automatically when fund, price and quantity agree, while same-wallet matching is blocked.</p></div>
          <div className="card"><div className="icon-chip"><Scale size={18}/></div><h3>Settlement & oversight</h3><p>Matched trades progress toward HSK atomic DvP while authorized oversight can selectively disclose the protected trade record.</p></div>
        </div>
      </section>

      <section className="section" id="privacy">
        <div className="landing-dual-view">
          <div><span className="eyebrow">Public market view</span><h2>Verify integrity, not strategy.</h2><p>Commitment, proof state and lifecycle can remain visible while counterparties and commercial amounts stay redacted.</p><div className="privacy-demo-row"><span>Buyer</span><b>PRIVATE</b></div><div className="privacy-demo-row"><span>Quantity</span><b>PRIVATE</b></div><div className="privacy-demo-row"><span>Commitment</span><b>0x9F…A2</b></div></div>
          <div><span className="eyebrow">Authorized regulator</span><h2>Disclose only when required.</h2><p>The regulator console can decrypt the same committed record for an authorized oversight session and logs that access.</p><div className="privacy-demo-row revealed"><span>Buyer</span><b>0x22…22</b></div><div className="privacy-demo-row revealed"><span>Quantity</span><b>25,000 vTBILL</b></div><div className="privacy-demo-row revealed"><span>Payment</span><b>252,500 vUSDC</b></div></div>
        </div>
      </section>

      <footer className="footer">VeilTrade — Team VeilForge · HSK Chain Blockchain Infrastructure Track · Sydney 2026</footer>
    </div>
  </main>;
}
