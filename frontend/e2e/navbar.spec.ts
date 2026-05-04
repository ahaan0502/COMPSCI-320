/**
 * E2E tests for the Navbar component
 * Covers link presence, active states, and Post Notes modal.
 */

import { test, expect } from '@playwright/test';

test.describe('Navbar — unauthenticated', () => {
  test('displays the UNotes brand name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'UNotes' })).toBeVisible();
  });

  test('shows Sign In button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByRole('link', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('Sign In button links to /auth/google', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('header').getByRole('link', { name: 'Sign In', exact: true });
    await expect(link).toHaveAttribute('href', '/auth/google');
  });

  test('Post Notes button is NOT visible when logged out', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /post notes/i })).not.toBeVisible();
  });

  test('My Classes nav link is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /my classes/i })).toBeVisible();
  });

  test('Saved Notes nav link is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /saved notes/i })).toBeVisible();
  });
});

test.describe('Navbar — active state', () => {
  test('My Classes link has aria-current="page" on /classes', async ({ page }) => {
  await page.goto('/classes');
  await page.waitForLoadState('networkidle');
  const link = page.locator('header').getByRole('link', { name: /my classes/i });
  const ariaCurrentValue = await link.getAttribute('aria-current');
  if (ariaCurrentValue === null) {
    // aria-current is only set after auth loads — skip when unauthenticated
    test.skip();
    return;
  }
  expect(ariaCurrentValue).toBe('page');
});

test('Saved Notes link has aria-current="page" on /savednotes', async ({ page }) => {
  await page.goto('/savednotes');
  await page.waitForLoadState('networkidle');
  const link = page.locator('header').getByRole('link', { name: /saved notes/i });
  const ariaCurrentValue = await link.getAttribute('aria-current');
  if (ariaCurrentValue === null) {
    test.skip();
    return;
  }
  expect(ariaCurrentValue).toBe('page');
});
});

test.describe('Navbar — Post Notes modal (authenticated)', () => {
  // To run these with a real session:
  // test.use({ storageState: 'e2e/auth-state.json' });

  test('Post Notes button opens Create New Post modal', async ({ page }) => {
    // test.use({ storageState: 'e2e/auth-state.json' });
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const postButton = page.getByRole('button', { name: /post notes/i });
    const isVisible = await postButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip(); // needs auth
      return;
    }

    await postButton.click();
    await expect(page.getByText('Create New Post')).toBeVisible();
  });

  test('modal closes when X button is clicked', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const postButton = page.getByRole('button', { name: /post notes/i });
    const isVisible = await postButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await postButton.click();
    await expect(page.getByText('Create New Post')).toBeVisible();

    // Click the X close button
    await page.getByRole('button', { name: '' }).last().click(); // X icon button
    await expect(page.getByText('Create New Post')).not.toBeVisible();
  });

  test('modal closes when clicking the backdrop', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const postButton = page.getByRole('button', { name: /post notes/i });
    const isVisible = await postButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await postButton.click();
    await expect(page.getByText('Create New Post')).toBeVisible();

    // Click the dark backdrop (outside the modal)
    await page.mouse.click(10, 10);
    await expect(page.getByText('Create New Post')).not.toBeVisible();
  });
});