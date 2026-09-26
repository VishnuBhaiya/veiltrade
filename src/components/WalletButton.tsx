'use client';

import { useEffect, useState } from 'react';
import { buildWalletSessionAuthorization } from '@/lib/auth-message';
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
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data?.authenticated || !data?.address) return;
        setAddress(data.address);
        localStorage.setItem('veiltrade_wallet', data.address);
        onAuthenticated?.(data.address);
      })
      .catch(() => null);
    return () => { cancelled = true; };
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
      setBusy(true);
      setMessage('');
      if (!window.ethereum) throw new Error('Install MetaMask first.');
      await ensureHSK();

      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      if (!account) throw new Error('No wallet account returned.');

      const current = await fetch('/api/auth/session', { cache: 'no-store' });
      if (current.ok) {
        const data = await current.json();
        if (data?.authenticated && data?.address?.toLowerCase() === account.toLowerCase()) {
          setAddress(account);
          localStorage.setItem('veiltrade_wallet', account);
          onAuthenticated?.(account);
          setMessage('Session active');
          return;
        }
      }

      const requestId = crypto.randomUUID();
      const issuedAt = new Date().toISOString();
      const origin = window.location.origin;
      const payload = { walletAddress: account, requestId, issuedAt, origin };
      const signature: string = await window.ethereum.request({
        method: 'personal_sign',
        params: [buildWalletSessionAuthorization(payload), account],
      });

      const verify = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, signature }),
      });
      const result = await verify.json();
      if (!verify.ok) throw new Error(result.error || 'Wallet sign-in failed.');

      setAddress(account);
      localStorage.setItem('veiltrade_wallet', account);
      onAuthenticated?.(account);
      setMessage('Signed in for 12h');
    } catch (error: any) {
      setMessage(error?.message || 'Wallet connection failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
      {message && <span className={message.includes('failed') || message.includes('Install') ? 'error' : 'success'} style={{ margin: 0 }}>{message}</span>}
      <button className={`btn ${address ? '' : 'btn-primary'}`} onClick={connect} disabled={busy}>
        {busy ? 'Signing in…' : address ? short(address) : 'Connect & sign in'}
      </button>
    </div>
  );
}
