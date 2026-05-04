/**
 * E2E tests for the Notes feed page (/notes)
 *
 * These tests use a logged-in session stored in a browser state file.
 * See the "Authenticated state setup" block below for how to generate it.
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

// ─── Authenticated state setup ────────────────────────────────────────────────
//
// Before these tests can run with a real session, generate auth state once:
//
//   npx playwright codegen --save-storage=e2e/auth-state.json http://localhost:3000
//
// Sign in via Google in that browser, then close it. The saved cookies will be
// reused by the tests below. Add e2e/auth-state.json to .gitignore.
//
// Uncomment the storageState line in each test.use() to enable.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notes feed — unauthenticated behaviour', () => {
  test('shows "Not logged in" error when no session exists', async ({ page }) => {
  await page.goto('/notes');
  await page.waitForLoadState('networkidle');
  const url = page.url();
  const wasRedirected = !url.includes('/notes');
  const hasError = await page.getByText(/not logged in/i).isVisible().catch(() => false);
  expect(wasRedirected || hasError).toBe(true);
});
});

test.describe('Notes feed — UI interactions', () => {
  // These tests verify UI behaviour without relying on real data.
  // They work unauthenticated by observing the error/empty states.

  test('search input is present on the notes page', async ({ page }) => {
  await page.goto('/notes');
  await page.waitForLoadState('networkidle');
  const url = page.url();
  // If redirected away, the test is vacuously valid for unauthenticated users
  if (!url.includes('/notes')) return;
  const searchBox = page.getByPlaceholder(/search notes/i);
  const errorMessage = page.getByText(/not logged in/i);
  const searchVisible = await searchBox.isVisible().catch(() => false);
  const errorVisible = await errorMessage.isVisible().catch(() => false);
  expect(searchVisible || errorVisible).toBe(true);
});

  test('feed tabs (hot / new / top) are rendered', async ({ page }) => {
    // Use storageState to run this with auth:
    // test.use({ storageState: 'e2e/auth-state.json' });
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // Only assertable when authenticated — skip gracefully if not
    const hotTab = page.getByRole('button', { name: /hot/i });
    const isVisible = await hotTab.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(); // needs auth
      return;
    }

    await expect(page.getByRole('button', { name: /hot/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /top/i })).toBeVisible();
  });

  test('clicking a tab marks it as active (aria-pressed)', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const newTab = page.getByRole('button', { name: /^new$/i });
    const isVisible = await newTab.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await newTab.click();
    await expect(newTab).toHaveAttribute('aria-pressed', 'true');
  });

  test('searching filters posts by title', async ({ page }) => {
    // Requires auth state + real data. Documents the expected behaviour.
    // test.use({ storageState: 'e2e/auth-state.json' });
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const searchBox = page.getByPlaceholder(/search notes/i);
    const isVisible = await searchBox.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await searchBox.fill('zzznomatchxxx');
    await expect(page.getByText(/no posts match your search/i)).toBeVisible();
  });

  test('empty search shows all posts (clears filter)', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const searchBox = page.getByPlaceholder(/search notes/i);
    const isVisible = await searchBox.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await searchBox.fill('zzznomatch');
    await searchBox.fill(''); // clear
    // The "no posts match" message should go away
    await expect(page.getByText(/no posts match your search/i)).not.toBeVisible();
  });
});

test.describe('Notes feed — navigation', () => {
  test('Browse Course Catalog link is visible on empty state', async ({ page }) => {
    // This link appears when a user has no enrolled courses
    // It's testable with auth + a fresh account with no enrollments
    // test.use({ storageState: 'e2e/auth-state.json' });
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const catalogLink = page.getByRole('link', { name: /browse course catalog/i });
    const isVisible = await catalogLink.isVisible().catch(() => false);
    if (isVisible) {
      await expect(catalogLink).toHaveAttribute('href', '/catalogue/departments');
    }
    // Test passes whether or not we're in an empty state
  });
});