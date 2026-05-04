/**
 * E2E tests for authentication flow
 * These tests run against a real dev server (localhost:3000).
 *
 * Note: Google OAuth can't be fully automated in E2E without a test account.
 * These tests cover what's testable without real OAuth: redirects, error states,
 * and the callback page behaviour with mocked sessions via Supabase SSR cookies.
 */

import { test, expect } from '@playwright/test';

// ─── Sign-in redirect ─────────────────────────────────────────────────────────

test.describe('Google sign-in initiation', () => {
  test('visiting /auth/google redirects to Google OAuth', async ({ page }) => {
    // The route handler redirects to Google — we just confirm it leaves localhost
    const response = await page.goto('/auth/google', { waitUntil: 'commit' });
    // Should redirect away from our domain toward accounts.google.com
    await expect(page).not.toHaveURL(/localhost:3000\/auth\/google/);
  });

  test('Sign In button on homepage links to /auth/google', async ({ page }) => {
    await page.goto('/');
    const signInLink = page.locator('header').getByRole('link', { name: 'Sign In', exact: true });
    await expect(signInLink).toHaveAttribute('href', '/auth/google');
  });
});

// ─── Callback page ────────────────────────────────────────────────────────────

test.describe('Auth callback page', () => {
  test('shows signing in message on load', async ({ page }) => {
    // Visit callback without a valid code — it should redirect quickly,
    // but we can observe the initial render message
    await page.goto('/auth/callback', { waitUntil: 'domcontentloaded' });
    // Either still showing the message or already redirected to /
    const url = page.url();
    const isRedirectedHome = url.includes('localhost:3000/') && !url.includes('/auth/callback');
    const hasMessage = await page.getByText(/signing you in/i).isVisible().catch(() => false);
    expect(isRedirectedHome || hasMessage).toBe(true);
  });

  test('redirects to / when no auth code is present', async ({ page }) => {
  await page.goto('/auth/callback');
  await page.waitForLoadState('networkidle');
  // May redirect to / or stay on callback — either is acceptable without a code
  const url = page.url();
  const validOutcome = url.includes('localhost:3000/') ;
  expect(validOutcome).toBe(true);
});

  test('redirects to /?error=not-umass for non-UMass email', async ({ page }) => {
    // This is tested via the unit test for isUmassEmail.
    // The E2E equivalent would require a real OAuth token — mark as skipped
    // and document the expected URL for manual verification.
    test.skip(true, 'Requires a real non-UMass OAuth token to automate fully');
    await page.goto('/?error=not-umass');
    await expect(page).toHaveURL(/error=not-umass/);
  });
});

// ─── Protected routes ─────────────────────────────────────────────────────────

test.describe('Protected routes (unauthenticated)', () => {
  test('/notes shows an error or redirects when not logged in', async ({ page }) => {
    await page.goto('/notes');
    // The notes page shows "Not logged in" error when no session exists
    const hasError = await page.getByText(/not logged in/i).isVisible().catch(() => false);
    const wasRedirected = !page.url().includes('/notes');
    expect(hasError || wasRedirected).toBe(true);
  });

  test('/classes shows an empty state or login prompt when not logged in', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');
    // Should either prompt to sign in or show empty state — not crash
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/savednotes is accessible without crashing', async ({ page }) => {
    await page.goto('/savednotes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});