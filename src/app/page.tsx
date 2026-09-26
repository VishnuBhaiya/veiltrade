import Link from 'next/link';
import { ArrowRight, Building2, LockKeyhole, Scale, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Brand } from '@/components/Brand';

export default function Home() {
  return (
    <main>
      <div className="shell">
        <nav className="nav">
          <Brand />
          <div className="nav-links">
            <a href="#problem">Problem</a><a href="#architecture">Architecture</a><a href="#privacy">Privacy</a>
          </div>
          <div className="nav-actions"><Link className="btn" href="/regulator">Regulator view</Link><Link className="btn btn-primary" href="/app">Open terminal</Link></div>
        </nav>
        <section className="hero">
          <div>
            <span className="eyebrow"><Sparkles size={14}/> Confidential institutional settlement</span>
            <h1><span className="gradient-text">The blockchain verifies the trade</span><br/>without seeing the trade.</h1>
            <p>VeilTrade is a privacy-first settlement layer for tokenized real-world assets on HSK Chain: confidential order flow, compliant counterparties, and atomic delivery-versus-payment.</p>
            <div className="hero-actions">
              <Link href="/app" className="btn btn-primary">Launch trading terminal <ArrowRight size={16} style={{ verticalAlign: 'middle', marginLeft: 7 }}/></Link>
              <Link href="/regulator" className="btn">Open selective disclosure</Link>
            </div>
            <div className="hero-proof"><span>HSK Chain testnet</span><span>Atomic DvP</span><span>Private order commitments</span><span>Regulator disclosure</span></div>
          </div>
          <div className="trade-visual">
            <div className="trade-top"><div><div className="muted" style={{fontSize:12}}>VEILTRADE // PRIVATE DVP</div><b>Settlement #VT-0192</b></div><span className="status">Proof valid</span></div>
            <div className="trade-row">
              <div className="trade-side"><small>Tokenized asset</small><strong><span className="hidden-bar" /></strong><div className="muted" style={{marginTop:8,fontSize:12}}>RWA quantity hidden</div></div>
              <div className="swap">↔</div>
              <div className="trade-side"><small>Stablecoin payment</small><strong><span className="hidden-bar" style={{width:100}} /></strong><div className="muted" style={{marginTop:8,fontSize:12}}>Payment amount hidden</div></div>
            </div>
            <div className="proof-grid">
              <div className="proof-cell">Counterparty eligibility<b>Verified ✓</b></div>
              <div className="proof-cell">Value conservation<b>Verified ✓</b></div>
              <div className="proof-cell">Settlement mode<b>Atomic DvP</b></div>
              <div className="proof-cell">Public disclosure<b>Commitments only</b></div>
            </div>
          </div>
        </section>
        <section className="section" id="problem">
          <div className="section-head"><span className="eyebrow">Why this exists</span><h2>Public settlement should not mean public strategy.</h2><p>Institutional trades contain commercially sensitive information: order size, timing, counterparties and positions. VeilTrade separates what the public chain must verify from what the market should be allowed to see.</p></div>
          <div className="grid-3">
            <div className="card"><div className="icon-chip"><LockKeyhole size={18}/></div><h3>Confidential order flow</h3><p>Orders are represented by cryptographic commitments before settlement, reducing information leakage and front-running exposure.</p></div>
            <div className="card"><div className="icon-chip"><Workflow size={18}/></div><h3>Atomic settlement</h3><p>The RWA leg and stablecoin leg settle together. Either both complete or neither does.</p></div>
            <div className="card"><div className="icon-chip"><Scale size={18}/></div><h3>Selective disclosure</h3><p>Public users see proofs and commitments while an authorized regulator can disclose the underlying trade record.</p></div>
          </div>
        </section>
        <section className="section" id="architecture">
          <div className="section-head"><span className="eyebrow">Built for HSK Chain</span><h2>Privacy, compliance and settlement in one flow.</h2></div>
          <div className="grid-3">
            <div className="card"><div className="icon-chip"><Building2 size={18}/></div><h3>Institution layer</h3><p>Wallet-authenticated institutions, eligibility levels, private orders and a price-time matching engine.</p></div>
            <div className="card"><div className="icon-chip"><ShieldCheck size={18}/></div><h3>Proof layer</h3><p>Noir circuit scaffolding, note commitments and nullifiers are designed for a generated on-chain verifier.</p></div>
            <div className="card"><div className="icon-chip"><Workflow size={18}/></div><h3>HSK settlement layer</h3><p>Solidity contracts implement compliant DvP on HSK testnet, with a shielded settlement extension for private notes.</p></div>
          </div>
        </section>
        <section className="section" id="privacy">
          <div className="trade-visual">
            <div className="trade-top"><div><span className="eyebrow">Selective disclosure</span><h2 style={{margin:'16px 0 0'}}>One transaction. Two legitimate views.</h2></div></div>
            <div className="trade-row">
              <div className="trade-side"><small>Public HSK view</small><strong>VALID ✓</strong><div className="muted" style={{marginTop:8}}>Amount PRIVATE · Counterparty PRIVATE · Proof PUBLIC</div></div>
              <div className="swap">→</div>
              <div className="trade-side"><small>Authorized regulator</small><strong>DISCLOSED</strong><div className="muted" style={{marginTop:8}}>Identity · quantity · payment · compliance trail</div></div>
            </div>
          </div>
        </section>
        <footer className="footer">VeilTrade — Team VeilForge · HSK Chain Blockchain Infrastructure Track · Sydney 2026</footer>
      </div>
    </main>
  );
}
