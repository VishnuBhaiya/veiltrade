import { randomBytes } from 'crypto';

type NonceRecord = { address: string; expires: number };
const g = globalThis as typeof globalThis & { __veilNonces?: Map<string, NonceRecord> };
if (!g.__veilNonces) g.__veilNonces = new Map();
const nonces = g.__veilNonces;

export function issueNonce(address: string) {
  const nonce = randomBytes(16).toString('hex');
  nonces.set(nonce, { address: address.toLowerCase(), expires: Date.now() + 5 * 60_000 });
  return nonce;
}

export function consumeNonce(address: string, nonce: string) {
  const record = nonces.get(nonce);
  if (!record) return false;
  nonces.delete(nonce);
  return record.address === address.toLowerCase() && record.expires >= Date.now();
}

export function buildLoginMessage(address: string, nonce: string, uri: string) {
  return [
    'VeilTrade wants you to sign in with your Ethereum account:',
    address,
    '',
    'Authenticate to the VeilTrade institutional demo.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    'Chain ID: 133',
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join('\n');
}
