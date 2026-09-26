import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Abi } from 'viem';
import { z } from 'zod';
import bootstrapArtifact from '@/generated/VeilDemoBootstrap.json';
import { hashkeyTestnet } from '@/lib/hsk';
import { getChainDeployment, setChainDeployment } from '@/lib/store';
import { WALLET_SESSION_COOKIE, verifyWalletSession } from '@/lib/wallet-session';

const Input = z.object({
  bootstrapAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

const client = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://testnet.hsk.xyz'),
});
const abi = bootstrapArtifact.abi as Abi;

export async function GET() {
  try {
    return NextResponse.json({ deployment: await getChainDeployment() });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyWalletSession(
    req.cookies.get(WALLET_SESSION_COOKIE)?.value,
    req.nextUrl.origin,
  );
  if (!session) return NextResponse.json({ error: 'Connect and sign in once first.' }, { status: 401 });

  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const bootstrapAddress = parsed.data.bootstrapAddress as `0x${string}`;
  const txHash = parsed.data.txHash as `0x${string}`;

  try {
    const [tx, receipt] = await Promise.all([
      client.getTransaction({ hash: txHash }),
      client.getTransactionReceipt({ hash: txHash }),
    ]);

    if (receipt.status !== 'success') throw new Error('Deployment transaction did not succeed.');
    if (!receipt.contractAddress || receipt.contractAddress.toLowerCase() !== bootstrapAddress.toLowerCase()) {
      throw new Error('Deployment address does not match the HSK receipt.');
    }
    if (tx.from.toLowerCase() !== session.walletAddress.toLowerCase()) {
      throw new Error('Deployment signer does not match the signed-in wallet.');
    }

    const [admin, usdc, rwa, registry, settlement] = await Promise.all([
      client.readContract({ address: bootstrapAddress, abi, functionName: 'admin' }),
      client.readContract({ address: bootstrapAddress, abi, functionName: 'usdc' }),
      client.readContract({ address: bootstrapAddress, abi, functionName: 'rwa' }),
      client.readContract({ address: bootstrapAddress, abi, functionName: 'registry' }),
      client.readContract({ address: bootstrapAddress, abi, functionName: 'settlement' }),
    ]) as [`0x${string}`,`0x${string}`,`0x${string}`,`0x${string}`,`0x${string}`];

    if (admin.toLowerCase() !== session.walletAddress.toLowerCase()) {
      throw new Error('Bootstrap admin does not match the signed-in wallet.');
    }

    const deployment = {
      bootstrapAddress,
      settlementAddress: settlement,
      usdcAddress: usdc,
      rwaAddress: rwa,
      registryAddress: registry,
      deployerWallet: session.walletAddress,
      txHash,
    };

    await setChainDeployment('veiltrade-admin-demo', deployment);
    return NextResponse.json({ ok: true, deployment: await getChainDeployment() });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.shortMessage || error?.message || error) }, { status: 400 });
  }
}
