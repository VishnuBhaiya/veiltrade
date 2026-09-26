import { createHash, randomUUID } from 'crypto';
import type { MatchResult, Order } from './types';

function makeCommitment(parts: Array<string | number>) {
  return `0x${createHash('sha256').update(parts.join('|')).digest('hex')}`;
}

function matchAsset(orders: Order[], assetId: string): MatchResult[] {
  const buys = orders
    .filter((o) => o.assetId === assetId && o.side === 'BUY' && ['OPEN', 'PARTIAL'].includes(o.status))
    .sort((a, b) => b.price - a.price || +new Date(a.createdAt) - +new Date(b.createdAt));

  const sells = orders
    .filter((o) => o.assetId === assetId && o.side === 'SELL' && ['OPEN', 'PARTIAL'].includes(o.status))
    .sort((a, b) => a.price - b.price || +new Date(a.createdAt) - +new Date(b.createdAt));

  const matches: MatchResult[] = [];

  while (true) {
    let chosenBuy: Order | undefined;
    let chosenSell: Order | undefined;

    // Find the best crossing pair while explicitly preventing self-matches.
    outer:
    for (const buy of buys) {
      if (buy.remainingQuantity <= 0 || !['OPEN', 'PARTIAL'].includes(buy.status)) continue;
      for (const sell of sells) {
        if (sell.remainingQuantity <= 0 || !['OPEN', 'PARTIAL'].includes(sell.status)) continue;
        if (buy.price < sell.price) break;
        if (buy.walletAddress.toLowerCase() === sell.walletAddress.toLowerCase()) continue;
        chosenBuy = buy;
        chosenSell = sell;
        break outer;
      }
    }

    if (!chosenBuy || !chosenSell) break;

    const quantity = Math.min(chosenBuy.remainingQuantity, chosenSell.remainingQuantity);
    const price = Number(((chosenBuy.price + chosenSell.price) / 2).toFixed(4));
    const paymentAmount = Number((quantity * price).toFixed(2));
    const createdAt = new Date().toISOString();
    const id = randomUUID();

    matches.push({
      id,
      buyOrderId: chosenBuy.id,
      sellOrderId: chosenSell.id,
      assetId,
      buyerWallet: chosenBuy.walletAddress,
      sellerWallet: chosenSell.walletAddress,
      quantity,
      price,
      paymentAmount,
      commitment: makeCommitment([id, chosenBuy.id, chosenSell.id, quantity, price, createdAt]),
      createdAt,
    });

    chosenBuy.remainingQuantity -= quantity;
    chosenSell.remainingQuantity -= quantity;
    chosenBuy.status = chosenBuy.remainingQuantity === 0 ? 'MATCHED' : 'PARTIAL';
    chosenSell.status = chosenSell.remainingQuantity === 0 ? 'MATCHED' : 'PARTIAL';
  }

  return matches;
}

export function matchOrders(input: Order[]): { orders: Order[]; matches: MatchResult[] } {
  const orders = input.map((o) => ({ ...o }));
  const assetIds = [...new Set(orders.map((o) => o.assetId))];
  const matches = assetIds.flatMap((assetId) => matchAsset(orders, assetId));
  return { orders, matches };
}
