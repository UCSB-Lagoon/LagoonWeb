/**
 * Captain referral code generator.
 *
 * Codes are short, ALL-CAPS, readable (no I/O/0/1) so they survive being
 * read aloud, typed into a phone, or printed on a hoodie tag.
 */
import crypto from "node:crypto";

// 28 readable chars: A-Z minus I, O; 2-9 (no 0, 1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCaptainCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/**
 * Try a few times to find a code that doesn't collide with an existing one.
 * `existsFn` returns true if the code is already taken.
 */
export async function uniqueCaptainCode(
  existsFn: (code: string) => Promise<boolean>,
  length = 6,
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCaptainCode(length);
    if (!(await existsFn(code))) return code;
  }
  // After 8 collisions (vanishingly unlikely at 28^6 = 481M codes), lengthen.
  return generateCaptainCode(length + 2);
}
