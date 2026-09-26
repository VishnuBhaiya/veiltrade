import { getSupabaseAdmin } from './supabase';
import type { Institution, Order, OrderSide, Trade } from './types';

const db = () => getSupabaseAdmin();

export async function listOrders(): Promise<Order[]> {
  const { data, error } = await db().rpc('veil_public_orders');
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    institutionId: 'private',
    walletAddress: '',
    assetId: r.asset_id,
    side: r.side,
    price: Number(r.price),
    quantity: Number(r.quantity),
    remainingQuantity: Number(r.remaining_quantity),
    commitment: r.commitment,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function createOrder(input: {
  id: string;
  walletAddress: string;
  assetId: string;
  side: OrderSide;
  price: number;
  quantity: number;
  notes?: string;
  commitment: string;
  createdAt: string;
}) {
  const { data, error } = await db().rpc('veil_create_order', {
    p_id: input.id,
    p_wallet_address: input.walletAddress,
    p_asset_id: input.assetId,
    p_side: input.side,
    p_price: input.price,
    p_quantity: input.quantity,
    p_notes: input.notes || '',
    p_commitment: input.commitment,
    p_created_at: input.createdAt,
  });
  if (error) throw error;
  return data as {
    order: Order;
    autoMatched: boolean;
    matchedCount: number;
    tradeId?: string | null;
  };
}

export async function listPublicTrades() {
  const { data, error } = await db().rpc('veil_public_trades');
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    assetId: r.asset_id,
    commitment: r.commitment,
    status: r.status,
    proofHash: r.proof_hash || undefined,
    txHash: r.tx_hash || undefined,
    createdAt: r.created_at,
    counterparties: 'PRIVATE',
    amount: 'PRIVATE',
    quantity: 'PRIVATE',
  }));
}

export async function listTradesForWallet(walletAddress: string): Promise<Trade[]> {
  const { data, error } = await db().rpc('veil_trades_for_wallet', { p_wallet: walletAddress });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    buyOrderId: r.buy_order_id,
    sellOrderId: r.sell_order_id,
    assetId: r.asset_id,
    buyerWallet: r.buyer_wallet,
    sellerWallet: r.seller_wallet,
    quantity: Number(r.quantity),
    price: Number(r.price),
    paymentAmount: Number(r.payment_amount),
    commitment: r.commitment,
    status: r.status,
    proofHash: r.proof_hash || undefined,
    txHash: r.tx_hash || undefined,
    createdAt: r.created_at,
    buyerAllowanceTxHash: r.buyer_allowance_tx_hash || undefined,
    sellerAllowanceTxHash: r.seller_allowance_tx_hash || undefined,
    anchoredTxHash: r.anchored_tx_hash || undefined,
    buyerApproved: Boolean(r.buyer_approved),
    sellerApproved: Boolean(r.seller_approved),
    settlementTxHash: r.settlement_tx_hash || undefined,
  }));
}

export async function updateTradeProgress(walletAddress: string, tradeId: string, action: 'ALLOWANCE'|'ANCHOR'|'APPROVE'|'SETTLE', txHash: string) {
  const { data, error } = await db().rpc('veil_update_trade_progress', {
    p_wallet: walletAddress,
    p_trade_id: tradeId,
    p_action: action,
    p_tx_hash: txHash,
  });
  if (error) throw error;
  return data as Trade;
}

export async function regulatorTrades(key: string) {
  const { data, error } = await db().rpc('veil_regulator_trades', { p_key: key });
  if (error) throw error;
  return data || [];
}

export async function listInstitutions(key: string): Promise<Institution[]> {
  const { data, error } = await db().rpc('veil_admin_institutions', { p_key: key });
  if (error) throw error;
  return (data || []) as Institution[];
}

export async function setInstitutionEligibility(key: string, walletAddress: string, eligible: boolean, kycLevel: number) {
  const { data, error } = await db().rpc('veil_set_eligibility', {
    p_key: key,
    p_wallet_address: walletAddress,
    p_eligible: eligible,
    p_kyc_level: kycLevel,
  });
  if (error) throw error;
  return data;
}
