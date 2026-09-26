import { getSupabaseAdmin } from './supabase';
import type { Asset, Institution, Order, OrderSide, Trade } from './types';

const db = () => getSupabaseAdmin();

function mapAsset(r: any): Asset {
  return {
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    description: r.description || undefined,
    issuer: r.issuer || undefined,
    contractAddress: r.contract_address || undefined,
    decimals: Number(r.decimals),
    assetType: r.asset_type,
    active: Boolean(r.active),
    indicativePrice: r.indicative_price == null ? undefined : Number(r.indicative_price),
    createdAt: r.created_at || undefined,
  };
}

export async function listAssets(): Promise<Asset[]> {
  const { data, error } = await db().rpc('veil_public_assets');
  if (error) throw error;
  return (data || []).map(mapAsset);
}

export async function listAdminAssets(key: string): Promise<Asset[]> {
  const { data, error } = await db().rpc('veil_admin_assets', { p_key: key });
  if (error) throw error;
  return (data || []).map(mapAsset);
}

export async function upsertAsset(key: string, asset: {
  id: string;
  symbol: string;
  name: string;
  description?: string;
  issuer?: string;
  contractAddress?: string;
  decimals: number;
  assetType: 'RWA' | 'STABLECOIN';
  indicativePrice: number;
}) {
  const { data, error } = await db().rpc('veil_admin_upsert_asset', {
    p_key: key,
    p_id: asset.id,
    p_symbol: asset.symbol,
    p_name: asset.name,
    p_description: asset.description || '',
    p_issuer: asset.issuer || '',
    p_contract_address: asset.contractAddress || '',
    p_decimals: asset.decimals,
    p_asset_type: asset.assetType,
    p_indicative_price: asset.indicativePrice,
  });
  if (error) throw error;
  return data;
}

export async function setAssetActive(key: string, id: string, active: boolean) {
  const { data, error } = await db().rpc('veil_admin_set_asset_active', {
    p_key: key,
    p_id: id,
    p_active: active,
  });
  if (error) throw error;
  return data;
}

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


export async function getDemoPortfolio(walletAddress: string) {
  const { data, error } = await db().rpc('veil_demo_portfolio', { p_wallet: walletAddress });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    assetId: r.asset_id,
    symbol: r.symbol,
    name: r.name,
    assetType: r.asset_type,
    indicativePrice: Number(r.indicative_price || 0),
    balance: Number(r.balance || 0),
    updatedAt: r.updated_at,
  }));
}

export async function topUpDemoPortfolio(walletAddress: string) {
  const { data, error } = await db().rpc('veil_demo_faucet', { p_wallet: walletAddress });
  if (error) throw error;
  return data;
}


export type ChainDeployment = {
  bootstrapAddress: string;
  settlementAddress: string;
  usdcAddress: string;
  rwaAddress: string;
  registryAddress: string;
  deployerWallet: string;
  txHash: string;
  createdAt?: string;
};

export async function getChainDeployment(): Promise<ChainDeployment | null> {
  const { data, error } = await db().rpc('veil_public_chain_deployment');
  if (error) throw error;
  const r = data?.[0];
  if (!r) return null;
  return {
    bootstrapAddress: r.bootstrap_address,
    settlementAddress: r.settlement_address,
    usdcAddress: r.usdc_address,
    rwaAddress: r.rwa_address,
    registryAddress: r.registry_address,
    deployerWallet: r.deployer_wallet,
    txHash: r.tx_hash,
    createdAt: r.created_at,
  };
}

export async function setChainDeployment(key: string, input: Omit<ChainDeployment, 'createdAt'>) {
  const { data, error } = await db().rpc('veil_set_demo_chain_deployment', {
    p_key: key,
    p_bootstrap_address: input.bootstrapAddress,
    p_settlement_address: input.settlementAddress,
    p_usdc_address: input.usdcAddress,
    p_rwa_address: input.rwaAddress,
    p_registry_address: input.registryAddress,
    p_deployer_wallet: input.deployerWallet,
    p_tx_hash: input.txHash,
  });
  if (error) throw error;
  return data;
}
