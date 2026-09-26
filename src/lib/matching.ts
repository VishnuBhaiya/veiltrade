import { createHash, randomUUID } from 'crypto';
import type { MatchResult, Order } from './types';

function makeCommitment(parts: Array<string | number>) {
  return `0x${createHash('sha256').update(parts.join('|')).digest('hex')}`;
}

function matchAsset(orders: Order[], assetId: string): MatchResult[] {
  const buys = orders.filter((o) => o.assetId === assetId && o.side === 'BUY' && ['OPEN', 'PARTIAL'].includes(o.status))
    .sort((a, b) => b.price - a.price || +new Date(a.createdAt) - +new Date(b.createdAt));
  const sells = orders.filter((o) => o.assetId === assetId && o.side === 'SELL' && ['OPEN', 'PARTIAL'].includes(o.status))
    .sort((a, b) => a.price - b.price || +new Date(a.createdAt) - +new Date(b.createdAt));
  const matches: MatchResult[] = [];

  let bi = 0;
  let si = 0;
  while (bi < buys.length && si < sells.length) {
    const buy = buys[bi];
    const sell = sells[si];
    if (buy.price < sell.price) break;

    const quantity = Math.min(buy.remainingQuantity, sell.remainingQuantity);
    const price = Number(((buy.price + sell.price) / 2).toFixed(4));
    const paymentAmount = Number((quantity * price).toFixed(2));
    const createdAt = new Date().toISOString();
    const id = randomUUID();

    matches.push({
      id, buyOrderId: buy.id, sellOrderId: sell.id, assetId,
      buyerWallet: buy.walletAddress, sellerWallet: sell.walletAddress,
      quantity, price, paymentAmount,
      commitment: makeCommitment([id, buy.id, sell.id, quantity, price, createdAt]),
      createdAt,
    });

    buy.remainingQuantity -= quantity;
    sell.remainingQuantity -= quantity;
    buy.status = buy.remainingQuantity === 0 ? 'MATCHED' : 'PARTIAL';
    sell.status = sell.remainingQuantity === 0 ? 'MATCHED' : 'PARTIAL';
    if (buy.remainingQuantity === 0) bi += 1;
    if (sell.remainingQuantity === 0) si += 1;
  }
  return matches;
}

export function matchOrders(input: Order[]): { orders: Order[]; matches: MatchResult[] } {
  const orders = input.map((o) => ({ ...o }));
  const assetIds = [...new Set(orders.map((o) => o.assetId))];
  const matches = assetIds.flatMap((assetId) => matchAsset(orders, assetId));
  return { orders, matches };
}
