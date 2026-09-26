export type WalletSessionAuthorization = {
  walletAddress: string;
  requestId: string;
  issuedAt: string;
  origin: string;
};

export function buildWalletSessionAuthorization(v: WalletSessionAuthorization) {
  return [
    'VeilTrade session authorization',
    '',
    'Sign in once to authorize private trading and trade access for this browser session.',
    'This is not a transaction and does not spend HSK.',
    '',
    `Wallet: ${v.walletAddress}`,
    `Request: ${v.requestId}`,
    `Origin: ${v.origin}`,
    `Issued At: ${v.issuedAt}`,
    'Chain ID: 133',
    'Session: 12 hours',
  ].join('\n');
}

export function isFresh(issuedAt: string, maxAgeMs = 12 * 60 * 60_000) {
  const ts = Date.parse(issuedAt);
  return Number.isFinite(ts) && Date.now() >= ts - 60_000 && Date.now() - ts <= maxAgeMs;
}
