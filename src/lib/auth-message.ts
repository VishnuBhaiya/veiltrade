export type OrderAuthorization = {
  walletAddress: string;
  requestId: string;
  issuedAt: string;
  assetId: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  notes?: string;
};

export function buildOrderAuthorization(v: OrderAuthorization) {
  return [
    'VeilTrade private order authorization',
    `Wallet: ${v.walletAddress}`,
    `Request: ${v.requestId}`,
    `Asset: ${v.assetId}`,
    `Side: ${v.side}`,
    `Price: ${v.price}`,
    `Quantity: ${v.quantity}`,
    `Notes: ${v.notes || ''}`,
    `Issued At: ${v.issuedAt}`,
    'Chain ID: 133',
  ].join('\n');
}

export function buildTradeAccessAuthorization(walletAddress: string, requestId: string, issuedAt: string) {
  return [
    'VeilTrade private trade access',
    `Wallet: ${walletAddress}`,
    `Request: ${requestId}`,
    `Issued At: ${issuedAt}`,
    'Chain ID: 133',
  ].join('\n');
}

export function isFresh(issuedAt: string, maxAgeMs = 5 * 60_000) {
  const ts = Date.parse(issuedAt);
  return Number.isFinite(ts) && Math.abs(Date.now() - ts) <= maxAgeMs;
}
