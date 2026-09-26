'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ArrowDownUp, Blocks, BookOpen, FileKey2, ShieldCheck, Sparkles } from 'lucide-react';
import { Brand } from './Brand';
import { WalletButton } from './WalletButton';

const items = [
  { href: '/app', label: 'Trading terminal', icon: Activity },
  { href: '/orderbook', label: 'Private order book', icon: BookOpen },
  { href: '/matches', label: 'Matches', icon: ArrowDownUp },
  { href: '/settlement', label: 'HSK settlement', icon: Blocks },
  { href: '/regulator', label: 'Regulator view', icon: FileKey2 },
  { href: '/admin', label: 'Compliance admin', icon: ShieldCheck },
];

export function AppChrome({ children, showWallet = true, onAuthenticated }: { children: ReactNode; showWallet?: boolean; onAuthenticated?: (address: string) => void; }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <header className="app-nav">
        <Brand />
        <div className="nav-actions">
          <span className="network-pill"><span className="network-dot" /> HSK Testnet · 133</span>
          {showWallet && <WalletButton onAuthenticated={onAuthenticated} />}
        </div>
      </header>
      <div className="app-grid">
        <aside className="sidebar">
          <div className="sidebar-label">Workspace</div>
          <nav className="sidebar-nav">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={`side-link ${active ? 'active' : ''}`}>
                  <span className="side-icon"><Icon size={17} /></span>
                  <span>{label}</span>
                  {active && <span className="active-dot" />}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-demo-card">
            <div className="sidebar-demo-title"><Sparkles size={14} /> Demo flow</div>
            <div className="demo-mini-step"><b>1</b><span>Create private order</span></div>
            <div className="demo-mini-step"><b>2</b><span>Match counterparties</span></div>
            <div className="demo-mini-step"><b>3</b><span>Settle atomically on HSK</span></div>
          </div>
          <div className="sidebar-footnote">
            <b>Privacy MVP</b>
            <span>Order commitments are private by default. Full shielded settlement is the ZK extension.</span>
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
