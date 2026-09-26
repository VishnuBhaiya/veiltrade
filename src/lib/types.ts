export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'PARTIAL' | 'MATCHED' | 'CANCELLED';
export type TradeStatus = 'MATCHED' | 'APPROVAL_PENDING' | 'READY' | 'SETTLED' | 'FAILED';

export interface Institution {
  id: string;
  name: string;
  walletAddress: string;
  kycLevel: number;
  eligible: boolean;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  description?: string;
  issuer?: string;
  contractAddress?: string;
  decimals: number;
  assetType: 'RWA' | 'STABLECOIN';
  active: boolean;
  indicativePrice?: number;
  createdAt?: string;
}

export interface PrivateOrderPayload {
  price: number;
  quantity: number;
  minFill?: number;
  notes?: string;
}

export interface Order {
  id: string;
  institutionId: string;
  walletAddress: string;
  assetId: string;
  side: OrderSide;
  price: number;
  quantity: number;
  remainingQuantity: number;
  commitment: string;
  encryptedPayload?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface MatchResult {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  assetId: string;
  buyerWallet: string;
  sellerWallet: string;
  quantity: number;
  price: number;
  paymentAmount: number;
  commitment: string;
  createdAt: string;
}

export interface Trade extends MatchResult {
  status: TradeStatus;
  txHash?: string;
  proofHash?: string;
  regulatorPayload?: string;
  buyerAllowanceTxHash?: string;
  sellerAllowanceTxHash?: string;
  anchoredTxHash?: string;
  buyerApproved?: boolean;
  sellerApproved?: boolean;
  settlementTxHash?: string;
}
