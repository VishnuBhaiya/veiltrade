import { createHash } from 'crypto';

export function hashCommitment(value: unknown) {
  return `0x${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}
