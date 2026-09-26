'use client';

import { useEffect, useState } from 'react';
import { HSK_NETWORK_PARAMS } from '@/lib/hsk';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] | object }) => Promise<any>;
      on?: (event: string, cb: (...args: any[]) => void) => void;
      removeListener?: (event: string, cb: (...args: any[]) => void) => void;
    };
  }
}

function short(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }

export function WalletButton({ onAuthenticated }: { onAuthenticated?: (address: string) => void }) {
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('veiltrade_wallet');
    if (saved) {
      setAddress(saved);
      onAuthenticated?.(saved);
    }
  }, [onAuthenticated]);

  async function ensureHSK() {
    if (!window.ethereum) throw new Error('MetaMask or another EVM wallet is required.');
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HSK_NETWORK_PARAMS.chainId }] });
    } catch (error: any) {
      if (error?.code !== 4902) throw error;
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [HSK_NETWORK_PARAMS] });
    }
  }

  async function connect() {
    try {
      setBusy(true); setMessage('');
      if (!window.ethereum) throw new Error('Install MetaMask first.');
      await ensureHSK();
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      if (!account) throw new Error('No wallet account returned.');
      setAddress(account);
      localStorage.setItem('veiltrade_wallet', account);
      onAuthenticated?.(account);
      setMessage('Connected to HSK testnet');
    } catch (error: any) {
      setMessage(error?.message || 'Wallet connection failed');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
      {message && <span className={message.includes('Connected') ? 'success' : 'error'} style={{ margin: 0 }}>{message}</span>}
      <button className={`btn ${address ? '' : 'btn-primary'}`} onClick={connect} disabled={busy}>
        {busy ? 'Connecting…' : address ? short(address) : 'Connect wallet'}
      </button>
    </div>
  );
}
