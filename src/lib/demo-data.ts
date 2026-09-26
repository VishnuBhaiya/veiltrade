import type { Asset, Institution, Order, Trade } from './types';

export const demoInstitutions: Institution[] = [
  { id: 'inst-harbour', name: 'Harbour Capital', walletAddress: '0x1111111111111111111111111111111111111111', kycLevel: 3, eligible: true },
  { id: 'inst-southern', name: 'Southern Cross Treasury', walletAddress: '0x2222222222222222222222222222222222222222', kycLevel: 2, eligible: true },
  { id: 'inst-pacific', name: 'Pacific Digital Markets', walletAddress: '0x3333333333333333333333333333333333333333', kycLevel: 3, eligible: true },
];

export const demoAssets: Asset[] = [
  {
    id: 'asset-vtbill',
    symbol: 'vTBILL',
    name: 'Veil Tokenized Treasury Fund',
    description: 'Tokenized short-duration treasury exposure for institutional settlement demos.',
    issuer: 'Veil Asset Management',
    decimals: 18,
    assetType: 'RWA',
    active: true,
    indicativePrice: 10.11,
  },
  {
    id: 'asset-vmmf',
    symbol: 'vMMF',
    name: 'Veil Money Market Fund',
    description: 'Tokenized money-market strategy for institutional treasury management.',
    issuer: 'Veil Asset Management',
    decimals: 18,
    assetType: 'RWA',
    active: true,
    indicativePrice: 25.40,
  },
  {
    id: 'asset-vbond',
    symbol: 'vBOND',
    name: 'Veil Investment Grade Bond Fund',
    description: 'Tokenized diversified investment-grade bond exposure.',
    issuer: 'Veil Asset Management',
    decimals: 18,
    assetType: 'RWA',
    active: true,
    indicativePrice: 48.75,
  },
  {
    id: 'asset-usdc',
    symbol: 'vUSDC',
    name: 'Mock USD Coin',
    description: 'Mock USD settlement token for the VeilTrade hackathon environment.',
    issuer: 'Veil Settlement Labs',
    decimals: 6,
    assetType: 'STABLECOIN',
    active: true,
    indicativePrice: 1,
  },
];

export const demoOrders: Order[] = [
  { id: 'ord-01', institutionId: 'inst-harbour', walletAddress: demoInstitutions[0].walletAddress, assetId: 'asset-vtbill', side: 'SELL', price: 10.08, quantity: 160000, remainingQuantity: 160000, commitment: '0x84f7…b102', status: 'OPEN', createdAt: new Date(Date.now() - 25000).toISOString() },
  { id: 'ord-02', institutionId: 'inst-pacific', walletAddress: demoInstitutions[2].walletAddress, assetId: 'asset-vtbill', side: 'SELL', price: 10.12, quantity: 90000, remainingQuantity: 90000, commitment: '0x1c22…09a4', status: 'OPEN', createdAt: new Date(Date.now() - 18000).toISOString() },
  { id: 'ord-03', institutionId: 'inst-southern', walletAddress: demoInstitutions[1].walletAddress, assetId: 'asset-vtbill', side: 'BUY', price: 10.14, quantity: 120000, remainingQuantity: 120000, commitment: '0x62aa…fd31', status: 'OPEN', createdAt: new Date(Date.now() - 12000).toISOString() },
  { id: 'ord-04', institutionId: 'inst-harbour', walletAddress: demoInstitutions[0].walletAddress, assetId: 'asset-vtbill', side: 'BUY', price: 10.03, quantity: 210000, remainingQuantity: 210000, commitment: '0x9110…7ed2', status: 'OPEN', createdAt: new Date(Date.now() - 5000).toISOString() },
];

export const demoTrades: Trade[] = [
  {
    id: 'trade-001', buyOrderId: 'ord-x1', sellOrderId: 'ord-x2', assetId: 'asset-vtbill',
    buyerWallet: demoInstitutions[1].walletAddress, sellerWallet: demoInstitutions[0].walletAddress,
    quantity: 50000, price: 10.06, paymentAmount: 503000, commitment: '0x9d11…c820',
    createdAt: new Date(Date.now() - 900000).toISOString(), status: 'SETTLED', txHash: '0xdemo0001', proofHash: '0xproof001',
  },
];
