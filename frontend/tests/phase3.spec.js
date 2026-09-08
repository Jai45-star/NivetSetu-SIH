import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
const fixtures = path.resolve('../backend/fixtures/documents');
const profile = { industryType: 'Food Processing', location: 'Pune, Maharashtra', investmentRange: '₹1 – ₹5 Crore', employeeRange: '50 – 200', businessStage: 'New Unit', description: 'Shree Foods demonstration' };
const files = { pan_incorporation: 'pan_incorporation', factory_layout: 'factory_layout', ownership_lease: 'expired_lease', fire_safety_layout: 'fire_safety_layout', site_plan: 'site_plan', pollution_declaration: 'mismatch_environment' };
async function uploadThroughUI(page, type, file) {
  await page.locator(`#document-${type} input[type=file]`).setInputFiles(path.join(fixtures, `${file}.pdf`));
  await expect(page.locator('.validation-progress')).toHaveCount(0, { timeout: 25000 });
  await expect(page.locator(`#document-${type} .doc-file-info`)).toContainText(`${file}.pdf`);
}
test('entrepreneur completes profile, detects three issues, fixes, reloads, revalidates and submits', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/entrepreneur');
  await page.getByRole('link', { name: 'Start New Application' }).first().click();
  await expect(page.getByRole('heading', { name: 'Business Profile', exact: true })).toBeVisible();
  for (const [id, value] of Object.entries({ industry: profile.industryType, location: profile.location, investment: profile.investmentRange, employees: profile.employeeRange, stage: profile.businessStage })) await page.locator(`#field-${id}`).selectOption(value);
  await page.getByRole('button', { name: 'Save & Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Required Approvals', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to Documents' }).click();
  for (const [type, file] of Object.entries(files)) if (type !== 'fire_safety_layout') await uploadThroughUI(page, type, file);
  await page.getByRole('button', { name: 'Continue to Review' }).click();
  await page.getByRole('button', { name: /Revalidate Application|Proceed to Validation/ }).click();
  await expect(page.locator('.validation-progress')).toHaveCount(0, { timeout: 25000 });
  await expect(page.getByRole('heading', { name: 'Company name mismatch detected', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Document appears expired', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fire Safety & Evacuation Layout missing', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit Application', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Company name mismatch detected', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fix Issues', exact: true }).click();
  await expect(page.locator('#validation-issues')).toBeFocused();
  await page.locator('.validation-issue').filter({ has: page.getByRole('heading', { name: 'Document appears expired', exact: true }) }).getByRole('button', { name: 'Fix document' }).click();
  await expect(page.locator('#document-ownership_lease')).toBeFocused();
  await uploadThroughUI(page, 'ownership_lease', 'ownership_lease');
  await uploadThroughUI(page, 'fire_safety_layout', 'fire_safety_layout');
  await uploadThroughUI(page, 'pollution_declaration', 'pollution_declaration');
  await expect(page.locator('.radial-value')).toHaveText('100%');
  await page.getByRole('button', { name: 'Continue to Review' }).click();
  await page.getByRole('button', { name: 'Revalidate Application', exact: true }).click();
  await expect(page.locator('.validation-progress')).toHaveCount(0, { timeout: 25000 });
  await expect(page.getByRole('heading', { name: 'Pre-validation Passed', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit Application', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Application submitted successfully' })).toBeVisible();
  await expect(page.getByText('Saved inside the NiveshSetu prototype.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Application submitted successfully' })).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('validation responsive reference checks', () => {
  let applicationId;
  test.beforeAll(async ({ request }) => {
    const created = await request.post('/api/applications', { data: { unitName: 'Shree Foods - Validation demo', businessProfile: profile } });
    expect(created.ok()).toBeTruthy();
    const { data } = await created.json(); applicationId = data.applicationId;
    for (const [type, name] of Object.entries(files)) {
      if (type === 'fire_safety_layout') continue;
      const upload = await request.post(`/api/applications/${applicationId}/documents`, { multipart: { documentId: type, file: { name: name + '.pdf', mimeType: 'application/pdf', buffer: fs.readFileSync(path.join(fixtures, name + '.pdf')) } } });
      expect(upload.ok()).toBeTruthy();
    }
  });
  for (const width of [1440, 1280, 1024, 768, 430, 390, 375]) test(`validation layout at ${width}px`, async ({ page, request }) => {
    await request.patch(`/api/applications/${applicationId}/current-step`, { data: { step: 3 } });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/entrepreneur/applications/${applicationId}`);
    await expect(page.getByRole('heading', { name: 'Upload Documents', exact: true })).toBeVisible();
    await expect(page.locator('.radial-value')).not.toHaveText('0%');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Fix Issues', exact: true }).click();
    await expect(page.locator('#validation-issues')).toBeFocused();
    if ([1440, 375].includes(width)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `../docs/screenshots/validation-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Continue to Review' }).click();
    await expect(page.getByRole('heading', { name: 'Review & Validation', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Submit Application', exact: true })).toBeDisabled();
  });
});
