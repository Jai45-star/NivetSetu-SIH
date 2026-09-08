import { test, expect } from '@playwright/test';
const paths = { entrepreneur: ['applications', 'applications/new', 'documents', 'notifications', 'assistant', 'help'], officer: ['applications', 'review', 'sla', 'reports', 'help'] };
test('role selectors, routes, refresh, active links, notifications and 404', async ({ page }) => {
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.goto('/');
 await expect(page.getByRole('heading', { level: 1 })).toContainText('Simpler Approvals.');
 await page.getByRole('link', { name: 'Login as Entrepreneur', exact: true }).click();
 await expect(page).toHaveURL(/\/entrepreneur$/);
 await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page');
 for (const [role, routes] of Object.entries(paths)) {
  for (const route of ['', ...routes]) {
   await page.goto(`/${role}/${route}`);
   await page.reload();
   await expect(page.locator('main')).toBeVisible();
   await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
   await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
 }
 await page.goto('/officer');
 await page.getByRole('button', { name: 'Notifications', exact: true }).click();
 await expect(page.getByText('In-app prototype updates')).toBeVisible();
 await page.getByRole('link', { name: 'Logout' }).click();
 await page.getByRole('link', { name: 'Login as Government Officer', exact: true }).click();
 await expect(page).toHaveURL(/\/officer$/);
 await page.goto('/');
 await page.getByRole('link', { name: /^Entrepreneur Start/ }).click();
 await expect(page).toHaveURL(/\/entrepreneur$/);
 await page.goto('/');
 await page.getByRole('link', { name: /^Government Officer Review/ }).click();
 await expect(page).toHaveURL(/\/officer$/);
 for (const route of ['/missing', '/officer/missing', '/entrepreneur/missing']) {
  await page.goto(route);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
 }
 expect(errors).toEqual([]);
});
for (const width of [1440, 1280, 1024, 768, 430, 390]) {
 test(`responsive layout and navigation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 960 });
  for (const path of ['/', '/entrepreneur', '/officer']) {
   await page.goto(path);
   await page.evaluate(() => document.fonts.ready);
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   if (width === 1440 || width === 390) await page.screenshot({ path: `../docs/screenshots/${path === '/' ? 'landing' : path.slice(1)}-${width}.png`, fullPage: true });
  }
  if (width < 1024) {
   const trigger = page.getByRole('button', { name: 'Open navigation' });
   await trigger.click();
   await expect(page.getByRole('dialog')).toBeVisible();
   await page.keyboard.press('Escape');
   await expect(page.getByRole('dialog')).toHaveCount(0);
   await expect(trigger).toBeFocused();
   await trigger.click();
   await page.getByRole('dialog').getByRole('link', { name: 'Review Queue' }).click();
   await expect(page).toHaveURL(/\/officer\/review$/);
   await expect(page.getByRole('dialog')).toHaveCount(0);
  } else {
   await page.getByRole('link', { name: 'Review Queue' }).click();
   await expect(page).toHaveURL(/\/officer\/review$/);
   await expect(page.getByRole('link', { name: 'Review Queue' })).toHaveAttribute('aria-current', 'page');
  }
 });
}

