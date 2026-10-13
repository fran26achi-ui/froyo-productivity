import { test, expect } from '@playwright/test';
import { addDays, format } from 'date-fns';

test.describe('Froyo V1 Studio — Authentication, Expanded Mascots & Wireframe Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
  });

  test('Test 1: Wireframe layout verification (Top Nav "Froyo V1 Studio", Tab 1/2, Left stacked Mascot+Todo, Right Calendar)', async ({
    page,
  }) => {
    // 1. Verify Header title and tabs
    await expect(page.getByTestId('app-title')).toHaveText('Froyo V1 Studio');
    await expect(page.getByTestId('nav-tab-1')).toContainText('Planner');
    await expect(page.getByTestId('nav-tab-2')).toContainText('Focus & Analytics');
    await expect(page.getByTestId('user-profile-menu-btn')).toBeVisible();

    // 2. Verify Left Stacked Column: Mascot module on top, To-do list underneath
    const leftPane = page.getByTestId('left-stacked-pane');
    await expect(leftPane).toBeVisible();

    const mascotModule = page.getByTestId('mascot-and-progress-module');
    const todoModule = page.getByTestId('todo-list-workspace-module');

    await expect(mascotModule).toBeVisible();
    await expect(todoModule).toBeVisible();

    // Check vertical stacking order (mascot module's Y coordinate is above todo module's Y coordinate)
    const mascotBox = await mascotModule.boundingBox();
    const todoBox = await todoModule.boundingBox();
    expect(mascotBox!.y).toBeLessThan(todoBox!.y);

    // 3. Verify Right Column dedicated to Large Interactive Calendar
    const calendarCol = page.getByTestId('right-calendar-column');
    await expect(calendarCol).toBeVisible();
    await expect(calendarCol.getByTestId('calendar-pane')).toBeVisible();
  });

  test('Test 2: Circular user profile icon dropdown menu with exactly 5 options and modal interactions', async ({
    page,
  }) => {
    const userBtn = page.getByTestId('user-profile-menu-btn');
    await userBtn.click();

    const dropdown = page.getByTestId('user-dropdown-menu');
    await expect(dropdown).toBeVisible();

    // Exactly 5 options:
    // 1. Account details
    const optAccount = page.getByTestId('menu-opt-account-details');
    await expect(optAccount).toHaveText('Account details');

    // 2. Configuration
    const optConfig = page.getByTestId('menu-opt-configuration');
    await expect(optConfig).toHaveText('Configuration');

    // 3. Theme engine
    const optTheme = page.getByTestId('menu-opt-theme-engine');
    await expect(optTheme).toHaveText('Theme engine');

    // 4. Dark/Light mode
    const optDarkLight = page.getByTestId('menu-opt-dark-light-mode');
    await expect(optDarkLight).toContainText('Dark/Light mode');

    // 5. Sign out
    const optSignOut = page.getByTestId('menu-opt-sign-out');
    await expect(optSignOut).toHaveText('Sign out');

    // Test clicking "Account details" opens the Account Details modal
    await optAccount.click();
    await expect(page.getByTestId('account-details-modal')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('account-details-modal')).not.toBeVisible();

    // Test Dark/Light mode toggle from dropdown swaps CSS variables
    await userBtn.click();
    await page.getByTestId('menu-opt-dark-light-mode').click();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    const darkBg = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--bg-canvas').trim()
    );
    expect(darkBg).toBe('#181316');
  });

  test('Test 3: Email and Password Authentication registration and login workflow', async ({
    page,
  }) => {
    // Open menu and sign out to enter unauthenticated state
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-sign-out').click();

    // Open user menu again and click "Sign in / Register"
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-sign-in').click();

    const authModal = page.getByTestId('auth-modal');
    await expect(authModal).toBeVisible();

    // Switch to Sign Up mode
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Fill in registration fields
    const testEmail = `sparkle_${Date.now()}@froyo.app`;
    await page.getByTestId('auth-name-input').fill('Sakura Artist');
    await page.getByTestId('auth-email-input').fill(testEmail);
    await page.getByTestId('auth-password-input').fill('pastelsecret123');
    await page.getByTestId('auth-submit-btn').click();

    // Verify modal closes and user is logged in
    await expect(authModal).not.toBeVisible();
    await expect(page.getByTestId('froyo-toast')).toContainText(`Signed in as Sakura Artist`);

    // Verify user profile button reflects the newly registered user initial
    await expect(page.getByTestId('user-profile-menu-btn')).toContainText('S');

    // Open Account Details to verify new Firestore user UID path
    await page.getByTestId('user-profile-menu-btn').click();
    await page.getByTestId('menu-opt-account-details').click();
    await expect(page.getByTestId('account-details-modal')).toContainText(testEmail);
  });

  test('Test 4: Mascot library expansion (Chihuahua, German Shepherd, Cupcake, Capybara, Pickle) and health states', async ({
    page,
  }) => {
    // Open Mascot Sanctuary
    await page.getByTestId('open-mascot-sanctuary-btn').click();
    const sanctuaryModal = page.getByTestId('mascot-sanctuary-modal');
    await expect(sanctuaryModal).toBeVisible();

    // Verify all 5 new mascots are selectable in the sanctuary
    await expect(page.getByTestId('select-mascot-chihuahua')).toBeVisible();
    await expect(page.getByTestId('select-mascot-german_shepherd')).toBeVisible();
    await expect(page.getByTestId('select-mascot-cupcake')).toBeVisible();
    await expect(page.getByTestId('select-mascot-capybara')).toBeVisible();
    await expect(page.getByTestId('select-mascot-pickle')).toBeVisible();

    // 1. Select Capybara
    await page.getByTestId('select-mascot-capybara').click();
    // Test Health state preview simulator for Capybara
    await page.getByTestId('simulate-health-flourishing').click();

    // Close modal and verify active mascot in stacked left pane
    await page.locator('[data-testid="mascot-sanctuary-modal"] button').first().click();
    const activeMascot = page.locator('[data-testid="mascot-and-progress-module"] [data-testid="mascot-companion"]');
    await expect(activeMascot).toHaveAttribute('data-mascot-type', 'capybara');
    await expect(activeMascot).toHaveAttribute('data-mascot-state', 'flourishing');

    // 2. Switch to Pickle in degraded state
    await page.getByTestId('open-mascot-sanctuary-btn').click();
    await page.getByTestId('select-mascot-pickle').click();
    await page.getByTestId('simulate-health-degraded').click();
    await page.locator('[data-testid="mascot-sanctuary-modal"] button').first().click();

    await expect(activeMascot).toHaveAttribute('data-mascot-type', 'pickle');
    await expect(activeMascot).toHaveAttribute('data-mascot-state', 'degraded');
  });

  test('Test 5: Dragging a task onto the calendar in the restructured wireframe layout', async ({
    page,
  }) => {
    const taskId = 'task-mascot-sync';
    const targetDateStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');

    const sourceTask = page.getByTestId(`task-item-${taskId}`);
    const targetCalendarCell = page.getByTestId(`calendar-day-${targetDateStr}`);

    await expect(sourceTask).toBeVisible();
    await expect(targetCalendarCell).toBeVisible();

    // Drag task from stacked To-do list onto right calendar column
    await sourceTask.dragTo(targetCalendarCell);

    // Verify task deadline updated in UI and calendar card
    await expect(page.getByTestId(`task-due-badge-${taskId}`)).toContainText(targetDateStr);
    await expect(targetCalendarCell.getByTestId(`calendar-plotted-item-${taskId}`)).toBeVisible();

    // Verify updated deadline persisted in Firestore mirror
    const persistedDueDate = await page.evaluate((id) => {
      const w = window as unknown as {
        __FROYO_FIRESTORE__: {
          getTaskById: (taskId: string) => { due_date: string } | null;
        };
      };
      return w.__FROYO_FIRESTORE__?.getTaskById(id)?.due_date;
    }, taskId);

    expect(persistedDueDate).toBe(targetDateStr);
  });
});
