'use client';

import { createPublicClient, createWalletClient, custom, http, keccak256, stringToHex, type Abi, type Hex } from 'viem';
import { hashkeyTestnet } from './hsk';
import { erc20Abi, veilSettlementAbi } from './contracts';
import bootstrapArtifact from '@/generated/VeilDemoBootstrap.json';

const bootstrapAbi = bootstrapArtifact.abi as Abi;
const bootstrapBytecode = bootstrapArtifact.bytecode as Hex;

function wallet() {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('Wallet not available');
  return createWalletClient({ chain: hashkeyTestnet, transport: custom(window.ethereum) });
}

export const hskPublicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://testnet.hsk.xyz'),
});

export function bytes32FromId(id: string) { return keccak256(stringToHex(id)); }

export async function waitForHskTransaction(hash: `0x${string}`) {
  const receipt = await hskPublicClient.waitForTransactionReceipt({ hash, confirmations: 1, timeout: 120_000 });
  if (receipt.status !== 'success') throw new Error('HSK transaction reverted.');
  return receipt;
}

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

export async function deployDemoBootstrap(account: `0x${string}`) {
  if (!bootstrapBytecode || bootstrapBytecode === '0x') throw new Error('Bootstrap bytecode is unavailable.');
  const hash = await wallet().deployContract({
    abi: bootstrapAbi,
    bytecode: bootstrapBytecode,
    account,
    chain: hashkeyTestnet,
  });
  const receipt = await waitForHskTransaction(hash);
  if (!receipt.contractAddress) throw new Error('HSK deployment confirmed without a contract address.');
  return { hash, address: receipt.contractAddress };
}

export async function readDemoBootstrap(address: `0x${string}`) {
  const [admin, usdc, rwa, registry, settlement] = await Promise.all([
    hskPublicClient.readContract({ address, abi: bootstrapAbi, functionName: 'admin' }),
    hskPublicClient.readContract({ address, abi: bootstrapAbi, functionName: 'usdc' }),
    hskPublicClient.readContract({ address, abi: bootstrapAbi, functionName: 'rwa' }),
    hskPublicClient.readContract({ address, abi: bootstrapAbi, functionName: 'registry' }),
    hskPublicClient.readContract({ address, abi: bootstrapAbi, functionName: 'settlement' }),
  ]);
  return {
    admin: admin as `0x${string}`,
    usdc: usdc as `0x${string}`,
    rwa: rwa as `0x${string}`,
    registry: registry as `0x${string}`,
    settlement: settlement as `0x${string}`,
  };
}

export async function hasClaimedDemoAssets(address: `0x${string}`, account: `0x${string}`) {
  return Boolean(await hskPublicClient.readContract({
    address,
    abi: bootstrapAbi,
    functionName: 'claimed',
    args: [account],
  }));
}

export async function claimDemoAssetsOnchain(address: `0x${string}`, account: `0x${string}`) {
  return wallet().writeContract({
    address,
    abi: bootstrapAbi,
    functionName: 'claimDemoAssets',
    account,
    chain: hashkeyTestnet,
  });
}

export function explorerTx(hash: string) {
  return `${process.env.NEXT_PUBLIC_HSK_EXPLORER_URL || 'https://testnet-explorer.hsk.xyz'}/tx/${hash}`;
}

export function explorerAddress(address: string) {
  return `${process.env.NEXT_PUBLIC_HSK_EXPLORER_URL || 'https://testnet-explorer.hsk.xyz'}/address/${address}`;
}
