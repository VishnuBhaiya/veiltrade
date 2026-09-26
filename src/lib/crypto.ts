import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function key() {
  const raw = process.env.VEILTRADE_ENCRYPTION_KEY;
  if (raw && /^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('VEILTRADE_ENCRYPTION_KEY must be a 64-character hex value in production');
  }
  return createHash('sha256').update(process.env.SESSION_SECRET || 'veiltrade-demo-key').digest();
}

export function encryptJson(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((b) => b.toString('base64url')).join('.');
}

export function decryptJson<T>(payload: string): T {
  const [ivRaw, tagRaw, cipherRaw] = payload.split('.');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  const plain = Buffer.concat([decipher.update(Buffer.from(cipherRaw, 'base64url')), decipher.final()]);
  return JSON.parse(plain.toString('utf8')) as T;
}

export function hashCommitment(value: unknown) {
  return `0x${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}
