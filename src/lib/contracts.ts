export const veilSettlementAbi = [
  { type: 'function', name: 'createTrade', stateMutability: 'nonpayable', inputs: [
    { name: 'tradeId', type: 'bytes32' }, { name: 'buyer', type: 'address' }, { name: 'seller', type: 'address' },
    { name: 'assetAmount', type: 'uint256' }, { name: 'paymentAmount', type: 'uint256' }, { name: 'commitment', type: 'bytes32' },
  ], outputs: [] },
  { type: 'function', name: 'approveTrade', stateMutability: 'nonpayable', inputs: [{ name: 'tradeId', type: 'bytes32' }], outputs: [] },
  { type: 'function', name: 'settle', stateMutability: 'nonpayable', inputs: [{ name: 'tradeId', type: 'bytes32' }], outputs: [] },
  { type: 'function', name: 'trades', stateMutability: 'view', inputs: [{ name: '', type: 'bytes32' }], outputs: [
    { name: 'buyer', type: 'address' }, { name: 'seller', type: 'address' }, { name: 'assetAmount', type: 'uint256' },
    { name: 'paymentAmount', type: 'uint256' }, { name: 'commitment', type: 'bytes32' }, { name: 'buyerApproved', type: 'bool' },
    { name: 'sellerApproved', type: 'bool' }, { name: 'status', type: 'uint8' },
  ] },
] as const;

export const erc20Abi = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;
