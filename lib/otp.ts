/**
 * OTP Generation for WebMCP Email Authentication
 */

export function generateOtp(): string {
  // 6-digit numeric, zero-padded, no leading-zero exclusion (000000–999999 all valid)
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
}
