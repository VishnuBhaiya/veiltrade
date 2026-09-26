import { createHmac, timingSafeEqual } from 'crypto';

export interface SessionPayload { address: string; exp: number }

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production');
  }
  return 'veiltrade-demo-session-secret';
}

export function signSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(token?: string | null): SessionPayload | null {
  try {
    if (!token) return null;
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const expected = createHmac('sha256', secret()).update(body).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
