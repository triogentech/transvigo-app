/**
 * Minimal JWT payload reader (no crypto, no verification — the server verifies).
 * Self-contained base64url decoder so we don't depend on a global `atob`.
 */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Decode(input: string): string {
  const str = input.replace(/=+$/, '');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of str) {
    const idx = B64.indexOf(ch);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

interface JwtPayload {
  exp?: number;
  sub?: string;
  orgId?: string;
  roleName?: string;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(base64Decode(b64)) as JwtPayload;
  } catch {
    return null;
  }
}

/** True if the token is missing/unparseable or within `skewSec` of expiry. */
export function isExpired(token: string, skewSec = 30): boolean {
  const exp = decodeJwt(token)?.exp;
  if (typeof exp !== 'number') return true;
  return Date.now() / 1000 >= exp - skewSec;
}
