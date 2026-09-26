'use client';

import { createWalletClient, custom, keccak256, stringToHex } from 'viem';
import { hashkeyTestnet } from './hsk';
import { erc20Abi, veilSettlementAbi } from './contracts';

function wallet() {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('Wallet not available');
  return createWalletClient({ chain: hashkeyTestnet, transport: custom(window.ethereum) });
}

export function bytes32FromId(id: string) { return keccak256(stringToHex(id)); }

export async function approveToken(token: `0x${string}`, spender: `0x${string}`, amount: bigint, account: `0x${string}`) {
  const client = wallet();
  return client.writeContract({ address: token, abi: erc20Abi, functionName: 'approve', args: [spender, amount], account, chain: hashkeyTestnet });
}

export async function createOnchainTrade(args: {
  settlement: `0x${string}`; id: string; buyer: `0x${string}`; seller: `0x${string}`;
  assetAmount: bigint; paymentAmount: bigint; commitment: `0x${string}`; account: `0x${string}`;
}) {
  return wallet().writeContract({
    address: args.settlement, abi: veilSettlementAbi, functionName: 'createTrade',
    args: [bytes32FromId(args.id), args.buyer, args.seller, args.assetAmount, args.paymentAmount, args.commitment],
    account: args.account, chain: hashkeyTestnet,
  });
}

export async function approveOnchainTrade(settlement: `0x${string}`, id: string, account: `0x${string}`) {
  return wallet().writeContract({ address: settlement, abi: veilSettlementAbi, functionName: 'approveTrade', args: [bytes32FromId(id)], account, chain: hashkeyTestnet });
}

export async function settleOnchainTrade(settlement: `0x${string}`, id: string, account: `0x${string}`) {
  return wallet().writeContract({ address: settlement, abi: veilSettlementAbi, functionName: 'settle', args: [bytes32FromId(id)], account, chain: hashkeyTestnet });
}

export function explorerTx(hash: string) {
  return `${process.env.NEXT_PUBLIC_HSK_EXPLORER_URL || 'https://testnet-explorer.hsk.xyz'}/tx/${hash}`;
}
