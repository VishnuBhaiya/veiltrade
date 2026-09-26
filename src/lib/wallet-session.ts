import { verifyMessage } from 'viem';
import { buildWalletSessionAuthorization, isFresh, type WalletSessionAuthorization } from './auth-message';

export const WALLET_SESSION_COOKIE = 'veiltrade_wallet_session';

export type SignedWalletSession = WalletSessionAuthorization & {
  signature: string;
};

export function encodeWalletSession(session: SignedWalletSession) {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
}

export function decodeWalletSession(value?: string | null): SignedWalletSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as SignedWalletSession;
    if (
      !parsed ||
      typeof parsed.walletAddress !== 'string' ||
      typeof parsed.requestId !== 'string' ||
      typeof parsed.issuedAt !== 'string' ||
      typeof parsed.origin !== 'string' ||
      typeof parsed.signature !== 'string'
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function verifyWalletSession(
  cookieValue: string | null | undefined,
  expectedOrigin?: string,
) {
  const session = decodeWalletSession(cookieValue);
  if (!session) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(session.walletAddress)) return null;
  if (!/^0x[a-fA-F0-9]+$/.test(session.signature)) return null;
  if (!isFresh(session.issuedAt)) return null;
  if (expectedOrigin && session.origin !== expectedOrigin) return null;

  const valid = await verifyMessage({
    address: session.walletAddress as `0x${string}`,
    message: buildWalletSessionAuthorization(session),
    signature: session.signature as `0x${string}`,
  });

  return valid ? session : null;
}
