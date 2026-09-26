import { randomUUID } from 'crypto';
import { demoAssets, demoInstitutions, demoOrders, demoTrades } from './demo-data';
import { encryptJson, hashCommitment } from './crypto';
import { getSupabaseAdmin, hasSupabase } from './supabase';
import type { Institution, Order, OrderSide, PrivateOrderPayload, Trade } from './types';

type Memory = { orders: Order[]; trades: Trade[]; institutions: Institution[] };
const globalStore = globalThis as typeof globalThis & { __veiltrade?: Memory };
if (!globalStore.__veiltrade) {
  globalStore.__veiltrade = {
    orders: structuredClone(demoOrders),
    trades: structuredClone(demoTrades),
    institutions: structuredClone(demoInstitutions),
  };
}
const memory = globalStore.__veiltrade!;

export async function listOrders(): Promise<Order[]> {
  if (!hasSupabase()) return memory.orders;
  const { data, error } = await getSupabaseAdmin().from('orders').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id, institutionId: r.institution_id, walletAddress: r.wallet_address, assetId: r.asset_id,
    side: r.side, price: Number(r.price), quantity: Number(r.quantity), remainingQuantity: Number(r.remaining_quantity),
    commitment: r.commitment, encryptedPayload: r.encrypted_payload || undefined, status: r.status, createdAt: r.created_at,
  }));
}

export async function createOrder(input: { walletAddress: string; institutionId?: string; assetId: string; side: OrderSide; price: number; quantity: number; notes?: string }) {
  const payload: PrivateOrderPayload = { price: input.price, quantity: input.quantity, notes: input.notes };
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const commitment = hashCommitment({ id, wallet: input.walletAddress, asset: input.assetId, side: input.side, ...payload, createdAt });
  const order: Order = {
    id, institutionId: input.institutionId || 'wallet-user', walletAddress: input.walletAddress, assetId: input.assetId,
    side: input.side, price: input.price, quantity: input.quantity, remainingQuantity: input.quantity,
    commitment, encryptedPayload: encryptJson(payload), status: 'OPEN', createdAt,
  };
  if (!hasSupabase()) {
    memory.orders.push(order);
    return order;
  }
  const { error } = await getSupabaseAdmin().from('orders').insert({
    id, institution_id: order.institutionId, wallet_address: order.walletAddress, asset_id: order.assetId, side: order.side,
    price: order.price, quantity: order.quantity, remaining_quantity: order.remainingQuantity, commitment,
    encrypted_payload: order.encryptedPayload, status: order.status, created_at: createdAt,
  });
  if (error) throw error;
  await writeAuditLog(input.walletAddress, 'ORDER_CREATED', id, { side: input.side, assetId: input.assetId, commitment });
  return order;
}

export async function replaceOrders(orders: Order[]) {
  if (!hasSupabase()) {
    memory.orders = orders;
    globalStore.__veiltrade = memory;
    return;
  }
  const db = getSupabaseAdmin();
  for (const order of orders) {
    const { error } = await db.from('orders').update({
      remaining_quantity: order.remainingQuantity,
      status: order.status,
    }).eq('id', order.id);
    if (error) throw error;
  }
}

export async function listTrades(): Promise<Trade[]> {
  if (!hasSupabase()) return memory.trades;
  const { data, error } = await getSupabaseAdmin().from('trades').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id, buyOrderId: r.buy_order_id, sellOrderId: r.sell_order_id, assetId: r.asset_id,
    buyerWallet: r.buyer_wallet, sellerWallet: r.seller_wallet, quantity: Number(r.quantity), price: Number(r.price),
    paymentAmount: Number(r.payment_amount), commitment: r.commitment, createdAt: r.created_at, status: r.status,
    txHash: r.tx_hash || undefined, proofHash: r.proof_hash || undefined, regulatorPayload: r.regulator_payload || undefined,
  }));
}

export async function appendTrades(trades: Trade[]) {
  if (!hasSupabase()) {
    memory.trades.push(...trades);
    return;
  }
  const rows = trades.map((t) => ({
    id: t.id, buy_order_id: t.buyOrderId, sell_order_id: t.sellOrderId, asset_id: t.assetId,
    buyer_wallet: t.buyerWallet, seller_wallet: t.sellerWallet, quantity: t.quantity, price: t.price,
    payment_amount: t.paymentAmount, commitment: t.commitment, status: t.status, created_at: t.createdAt,
    tx_hash: t.txHash || null, proof_hash: t.proofHash || null, regulator_payload: t.regulatorPayload || null,
  }));
  const { error } = await getSupabaseAdmin().from('trades').insert(rows);
  if (error) throw error;
  for (const trade of trades) {
    await writeAuditLog('matching-engine', 'TRADE_MATCHED', trade.id, { commitment: trade.commitment });
  }
}

export async function listInstitutions(): Promise<Institution[]> {
  if (!hasSupabase()) return memory.institutions;
  const { data, error } = await getSupabaseAdmin().from('institutions').select('*').order('name');
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    walletAddress: r.wallet_address,
    kycLevel: Number(r.kyc_level),
    eligible: Boolean(r.eligible),
  }));
}

export async function setInstitutionEligibility(walletAddress: string, eligible: boolean, kycLevel: number) {
  if (!hasSupabase()) {
    const found = memory.institutions.find((i) => i.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    if (found) {
      found.eligible = eligible;
      found.kycLevel = kycLevel;
    }
    return found || null;
  }
  const { data, error } = await getSupabaseAdmin().from('institutions')
    .update({ eligible, kyc_level: kycLevel })
    .eq('wallet_address', walletAddress)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  await writeAuditLog('compliance-admin', 'ELIGIBILITY_UPDATED', walletAddress, { eligible, kycLevel });
  return data;
}

export async function writeAuditLog(actor: string, action: string, referenceId?: string, metadata: Record<string, unknown> = {}) {
  if (!hasSupabase()) return;
  const { error } = await getSupabaseAdmin().from('audit_logs').insert({
    actor, action, reference_id: referenceId || null, metadata,
  });
  if (error) throw error;
}

export const publicAssets = demoAssets;
