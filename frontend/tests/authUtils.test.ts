/**
 * Unit tests for auth utility: isUmassEmail
 *
 * Extract isUmassEmail from app/auth/callback/page.tsx into app/lib/authUtils.ts
 * (see instructions at bottom of this file).
 */

import { isUmassEmail } from '@/app/lib/authUtils';

describe('isUmassEmail', () => {
  it('returns true for a plain @umass.edu address', () => {
    expect(isUmassEmail('student@umass.edu')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isUmassEmail('Student@UMass.EDU')).toBe(true);
  });

  it('handles leading/trailing whitespace', () => {
    expect(isUmassEmail('  student@umass.edu  ')).toBe(true);
  });

  it('returns false for a Gmail address', () => {
    expect(isUmassEmail('student@gmail.com')).toBe(false);
  });

  it('returns false for an address that contains but does not end with @umass.edu', () => {
    expect(isUmassEmail('attacker@umass.edu.evil.com')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isUmassEmail('')).toBe(false);
  });

  it('returns false for other .edu addresses', () => {
    expect(isUmassEmail('student@mit.edu')).toBe(false);
  });
});

/**
 * ─── SETUP INSTRUCTIONS ────────────────────────────────────────────────────
 *
 * Create app/lib/authUtils.ts:
 *
 * export function isUmassEmail(email: string): boolean {
 *   return email.trim().toLowerCase().endsWith('@umass.edu');
 * }
 *
 * Then update app/auth/callback/page.tsx to import from there:
 * import { isUmassEmail } from '@/app/lib/authUtils';
 */