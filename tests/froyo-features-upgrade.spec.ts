import { test, expect } from '@playwright/test';
import { format } from 'date-fns';

test.describe('Froyo V1 Studio — Comprehensive Modules Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
  });

  test('Module 1: Favicon, Brand Logo & Auth UI Integration', async ({ page }) => {
    // 1. Verify index.html favicon points to froyo-logo.svg
    const faviconHref = await page.locator('link[rel="icon"]').getAttribute('href');
    expect(faviconHref).toBe('/froyo-logo.svg');

    // 2. Verify header has animated Froyo brand logo
    const headerLogo = page.locator('header [data-testid="froyo-logo"]');
    await expect(headerLogo).toBeVisible();

    // 3. Open Auth modal and verify prominent Froyo brand logo
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-sign-out').click();
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-sign-in').click();

    const authModal = page.getByTestId('auth-modal');
    await expect(authModal).toBeVisible();
    await expect(authModal.getByTestId('froyo-logo')).toBeVisible();
  });

  test('Module 2: Calendar & To-Do Decoupling, List Calendar Linking & Universal Health', async ({
    page,
  }) => {
    // 1. Create a custom standalone list
    await page.locator('button[title="Create Standalone Custom List"]').click();
    await page.locator('input[placeholder="List name..."]').fill('Sprint Work');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // 2. Verify list is created and currently decoupled (not linked to calendar)
    const linkToggleBtn = page.getByTestId('toggle-calendar-link-btn');
    await expect(linkToggleBtn).toBeVisible();
    await expect(linkToggleBtn).toContainText('Link to Calendar');

    // 3. Add an unlinked task to this list
    await page.getByTestId('new-task-input').fill('Unlinked Standalone Strategy');
    await page.getByTestId('new-task-submit-btn').click();

    // Verify task is in to-do tree
    await expect(page.locator('[data-testid^="task-title-"]').filter({ hasText: 'Unlinked Standalone Strategy' })).toBeVisible();

    // 4. Toggle "Link to Calendar"
    await linkToggleBtn.click();
    await expect(linkToggleBtn).toContainText('Calendar Linked');
    await expect(page.getByTestId('froyo-toast')).toContainText('Linked "Sprint Work" to the interactive calendar!');

    // 5. In linked mode, verify task composer offers date, time, and all-day toggle
    await expect(page.getByTestId('new-task-date-input')).toBeVisible();
    await expect(page.getByTestId('new-task-time-input')).toBeVisible();

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await page.getByTestId('new-task-input').fill('Calendar-Linked Sprint Demo');
    await page.getByTestId('new-task-time-input').fill('14:30');
    await page.getByTestId('new-task-submit-btn').click();

    // 6. Check that the calendar cell for today renders this linked task
    const todayCell = page.getByTestId(`calendar-day-${todayStr}`);
    await expect(todayCell.getByText('Calendar-Linked Sprint Demo')).toBeVisible();

    // 7. Check off a task and verify universal health progression + coins award
    const initialCoins = await page.getByTestId('wallet-coins-count').textContent();
    const taskCheckbox = page.locator('button[data-testid^="task-checkbox-"]').first();
    await taskCheckbox.click();

    // Verify coin gain celebration banner appears
    await expect(page.getByTestId('coin-gain-popup')).toBeVisible();
    await expect(page.getByTestId('coin-gain-popup')).toContainText('Froyo Coins');

    // Verify wallet updated
    const updatedCoins = await page.getByTestId('wallet-coins-count').textContent();
    expect(Number(updatedCoins)).toBeGreaterThan(Number(initialCoins));
  });

  test('Module 3: Custom Theme Builder & Persistence', async ({ page }) => {
    // Open Theme Studio modal from user menu
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-theme-engine').click();

    const themeModal = page.getByTestId('theme-studio-modal');
    await expect(themeModal).toBeVisible();

    // Set custom hex colors
    const canvasHexInput = page.getByTestId('custom-hex-bgCanvas');
    await expect(canvasHexInput).toBeVisible();
    await canvasHexInput.fill('#112233');

    // Click "Save to Cloud Profile"
    await page.getByTestId('save-theme-to-cloud-btn').click();
    await expect(page.getByTestId('froyo-toast')).toContainText('Custom aesthetic saved');

    // Verify CSS variable is applied to document root
    const bgCanvas = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--bg-canvas').trim()
    );
    expect(bgCanvas.toLowerCase()).toBe('#112233');
  });

  test('Module 4: Virtual Currency & Sanctuary Shop Accessories Layering', async ({ page }) => {
    // Open Sanctuary Shop from header wallet button
    await page.getByTestId('open-sanctuary-shop-btn').click();

    const shopModal = page.getByTestId('sanctuary-shop-modal');
    await expect(shopModal).toBeVisible();

    // Verify all 5 universal accessories exist in catalog
    await expect(shopModal.getByTestId('shop-item-crown')).toBeVisible();
    await expect(shopModal.getByTestId('shop-item-pixel_glasses')).toBeVisible();
    await expect(shopModal.getByTestId('shop-item-nightcap')).toBeVisible();
    await expect(shopModal.getByTestId('shop-item-pastel_aura')).toBeVisible();
    await expect(shopModal.getByTestId('shop-item-coffee_cup')).toBeVisible();

    // Equip Nightcap (unlocked by default in demo wallet)
    await shopModal.getByTestId('equip-btn-nightcap').click();
    await expect(page.getByTestId('froyo-toast')).toContainText('Equipped nightcap!');

    // Close shop modal
    await shopModal.getByRole('button', { name: 'Close' }).click();
    await expect(shopModal).not.toBeVisible();

    // Verify active mascot companion now renders accessory vector
    const mascotCompanion = page.locator('[data-testid="mascot-and-progress-module"] [data-testid="mascot-companion"]');
    await expect(mascotCompanion.locator('[data-testid="accessory-nightcap"]')).toBeVisible();
  });

  test('Module 5: Push Notifications & Strict Admin RBAC (maker@froyo.app)', async ({ page }) => {
    // 1. Check guest / normal demo user: Admin Center must NOT be visible
    await expect(page.getByTestId('open-admin-broadcast-btn')).not.toBeVisible();

    // 2. Check Push Notification toggle in Configuration modal
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-configuration').click();

    const configModal = page.getByTestId('configuration-modal');
    await expect(configModal).toBeVisible();
    await expect(page.getByTestId('fcm-notifications-toggle')).toBeVisible();
    await configModal.getByRole('button', { name: 'Save Preferences' }).click();

    // 3. Log in as hardcoded administrator: maker@froyo.app
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-sign-out').click();
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-sign-in').click();

    await page.getByTestId('auth-email-input').fill('maker@froyo.app');
    await page.getByTestId('auth-password-input').fill('masterfroyo2026');
    await page.getByTestId('auth-submit-btn').click();

    // 4. Verify Administrator privileges are granted exclusively to maker@froyo.app
    const adminCenterBtn = page.getByTestId('open-admin-broadcast-btn');
    await expect(adminCenterBtn).toBeVisible();

    // 5. Open Admin Broadcast Center
    await adminCenterBtn.click();
    const adminModal = page.getByTestId('admin-broadcast-modal');
    await expect(adminModal).toBeVisible();
    await expect(adminModal).toContainText('maker@froyo.app');

    // 6. Broadcast push notification
    await adminModal.getByTestId('broadcast-title-input').fill('Froyo V1 Studio Launch');
    await adminModal.getByTestId('broadcast-body-input').fill('Welcome to the brand new Froyo Productivity experience!');
    await adminModal.getByTestId('broadcast-submit-btn').click();

    // Verify broadcast was dispatched and feedback banner appeared
    const feedbackBanner = adminModal.getByTestId('admin-broadcast-feedback');
    await expect(feedbackBanner).toBeVisible();
    await expect(feedbackBanner).toContainText('Broadcast successfully pushed');
  });
});
