/**
 * TOTP (Time-based One-Time Password) — RFC 6238
 * 
 * Compatible with Google Authenticator, Authy, 1Password, Microsoft Authenticator.
 * Pure TypeScript implementation using Web Crypto API.
 * 
 * Flow:
 * 1. Enroll: Generate a random secret, return otpauth:// URI + QR code
 * 2. Verify: User enters 6-digit code from their authenticator app
 * 3. Login: After password, user enters fresh 6-digit code
 */

import { createHmac, randomBytes } from 'crypto';

// ==================== TYPES ====================

export interface TOTPSecret {
  secret: string;          // Base32-encoded secret
  secretRaw: Buffer;       // Raw secret bytes
  otpauthUri: string;      // otpauth:// URI for QR code
  issuer: string;
  accountName: string;
  period: number;          // Time step in seconds (default 30)
  digits: number;          // Code length (default 6)
}

export interface TOTPVerifyResult {
  valid: boolean;
  delta: number;           // Time step offset (-1, 0, 1) — accounts for clock drift
  remaining: number;       // Seconds until current code expires
  error?: string;
}

// ==================== BASE32 ENCODING ====================

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = '';
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, '0');
    result += BASE32_CHARS[parseInt(chunk, 2)];
  }
  return result;
}

function base32Decode(str: string): Buffer {
  const clean = str.replace(/[=\s]/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) throw new Error(`Invalid base32 character: ${char}`);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// ==================== TOTP CORE ====================

/**
 * Generate HMAC-SHA1 for HOTP (RFC 4226)
 * Uses Web Crypto API for browser compatibility
 */
async function hotp(secret: Buffer, counter: number): Promise<number> {
  // Convert counter to 8-byte big-endian buffer
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuf.writeUInt32BE(counter & 0xffffffff, 4);

  // HMAC-SHA1 using Node.js crypto (works in Next.js server-side)
  const hmac = createHmac('sha1', secret).update(counterBuf).digest();

  // Dynamic truncation (RFC 4226 Section 5.4)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return code % 1000000; // 6-digit code
}

/**
 * Generate TOTP code for a given time step
 */
async function totp(secret: Buffer, time: number, period: number = 30, digits: number = 6): Promise<string> {
  const counter = Math.floor(time / period);
  const code = await hotp(secret, counter);
  return String(code).padStart(digits, '0');
}

// ==================== PUBLIC API ====================

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(issuer: string, accountName: string, period: number = 30, digits: number = 6): TOTPSecret {
  // Generate 20 bytes of entropy (160 bits — same as Google Authenticator)
  const secretRaw = randomBytes(20);
  const secret = base32Encode(secretRaw);

  const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${digits}&period=${period}`;

  return {
    secret,
    secretRaw,
    otpauthUri,
    issuer,
    accountName,
    period,
    digits,
  };
}

/**
 * Verify a TOTP code with ±1 time-step window for clock drift tolerance
 */
export function verifyTOTP(
  secretBase32: string,
  code: string,
  period: number = 30,
  digits: number = 6,
  window: number = 1
): TOTPVerifyResult {
  const secret = base32Decode(secretBase32);
  const now = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(now / period);

  // Check current time step and ±window for drift tolerance
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;

    // Generate expected code synchronously using Node crypto
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuf.writeUInt32BE(counter & 0xffffffff, 4);

    const hmacResult = createHmac('sha1', secret).update(counterBuf).digest();
    const offset = hmacResult[hmacResult.length - 1] & 0x0f;
    const truncated =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);
    const expected = String(truncated % (10 ** digits)).padStart(digits, '0');

    if (code === expected) {
      const remaining = period - (now % period);
      return { valid: true, delta: i, remaining, error: undefined };
    }
  }

  const remaining = period - (now % period);
  return { valid: false, delta: 0, remaining, error: 'Invalid TOTP code. Check your authenticator app and try again.' };
}

/**
 * Get remaining seconds before the current TOTP code expires
 */
export function getTOTPRemaining(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

/**
 * Generate backup/recovery codes (8 one-time-use codes)
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(4);
    const code = bytes.toString('hex').toUpperCase().substring(0, 8);
    codes.push(`${code.substring(0, 4)}-${code.substring(4)}`);
  }
  return codes;
}
