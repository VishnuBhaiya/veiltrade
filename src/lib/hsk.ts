import { defineChain } from 'viem';

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HSKChain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://testnet.hsk.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'HSKChain Testnet Explorer',
      url: process.env.NEXT_PUBLIC_HSK_EXPLORER_URL || 'https://testnet-explorer.hsk.xyz',
    },
  },
  testnet: true,
});

export const HSK_NETWORK_PARAMS = {
  chainId: '0x85',
  chainName: 'HSKChain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: [process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://testnet.hsk.xyz'],
  blockExplorerUrls: [process.env.NEXT_PUBLIC_HSK_EXPLORER_URL || 'https://testnet-explorer.hsk.xyz'],
};
