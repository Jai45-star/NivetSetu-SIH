import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test.describe('Phase 2 Entrepreneur Application Journey', () => {
  // Create temporary test files for upload
  const tempDir = path.resolve('./tests/temp-uploads');
  const samplePdf = path.join(tempDir, 'test-doc.pdf');

  test.beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(samplePdf, '%PDF-1.4 test dummy pdf content for niveshsetu prototype');
  });

  test.afterAll(() => {
    try {
      if (fs.existsSync(samplePdf)) fs.unlinkSync(samplePdf);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch {
      // ignore cleanup errors
    }
  });

  test('complete end-to-end entrepreneur draft and checklist flow', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // 1. Landing -> Login as Entrepreneur
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Simpler Approvals.');
    await page.getByRole('link', { name: 'Login as Entrepreneur', exact: true }).click();
    await expect(page).toHaveURL(/\/entrepreneur$/);

    // 2. Dashboard metrics and applications
    await expect(page.getByRole('heading', { level: 1 })).toContainText("Let's move your business forward!");
    await expect(page.locator('.metrics-grid').getByText('Total Applications')).toBeVisible();
    await expect(page.locator('.metrics-grid').getByText('Draft', { exact: true })).toBeVisible();

    // 3. Start New Application
    await page.getByRole('link', { name: 'Start New Application' }).first().click();
    await expect(page).toHaveURL(/\/entrepreneur\/applications\/(new|NS-2026-[A-F0-9]+)/);
    await expect(page.getByRole('heading', { name: 'Business Profile' })).toBeVisible();

    // 4. Fill Business Profile (Step 1)
    await page.locator('#field-industry').selectOption('Food Processing');
    await page.locator('#field-location').selectOption('Pune, Maharashtra');
    await page.locator('#field-investment').selectOption('₹1 – ₹5 Crore');
    await page.locator('#field-employees').selectOption('50 – 200');
    await page.locator('#field-stage').selectOption('New Unit');
    await page.locator('#field-description').fill('Manufacturing of packaged food products in Pune MIDC.');

    // Save & Continue
    await page.getByRole('button', { name: /Save & Continue/ }).click();

    // 5. Step 2: Required Approvals
    await expect(page.getByRole('heading', { name: 'Required Approvals' })).toBeVisible();
    await expect(page.getByText('Prototype checklist generated from demo regulatory rules')).toBeVisible();

    // Verify 4 generated approvals
    await expect(page.locator('.approvals-grid').getByText('Factory Licence').first()).toBeVisible();
    await expect(page.locator('.approvals-grid').getByText('Fire NOC (Provisional)').first()).toBeVisible();
    await expect(page.locator('.approvals-grid').getByText('Pollution Consent to Establish (CTE)').first()).toBeVisible();

    // 6. Test "View Requirements" explainability modal
    const viewRequirementsBtn = page.getByRole('button', { name: 'View Requirements' }).first();
    await viewRequirementsBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Explainable Regulatory Rationale')).toBeVisible();
    await expect(page.getByText('Matched Business Profile Parameters')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Food Processing')).toBeVisible();
    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // 7. Continue to Documents (Step 3)
    await page.getByRole('button', { name: /Continue to Documents/ }).click();
    await expect(page.getByRole('heading', { name: 'Upload Documents' })).toBeVisible();

    // Verify document reuse indicator
    await expect(page.getByText(/Used in \d+ approvals/).first()).toBeVisible();

    // Verify initial completeness card
    await expect(page.getByRole('heading', { name: 'Application Readiness' })).toBeVisible();

    // 8. Upload first document
    const firstInput = page.locator('.doc-missing input[type="file"]').first();
    await firstInput.setInputFiles(samplePdf);
    await expect(page.locator('.doc-uploaded .doc-file-info').first()).toBeVisible({ timeout: 10000 });

    // 9. Navigate away to Applications listing and return
    await page.goto('/entrepreneur/applications');
    await expect(page.getByRole('heading', { name: 'Industrial Approval Pipeline' })).toBeVisible();
    await expect(page.getByText('Food Processing Unit').first()).toBeVisible();

    // Click Continue on the draft
    await page.getByRole('link', { name: /Continue/ }).first().click();
    await expect(page).toHaveURL(/\/entrepreneur\/applications\/NS-2026-[A-F0-9]+/);

    // Navigate to Step 3 Documents
    await page.getByRole('button', { name: /Upload Documents/ }).click();
    await expect(page.getByRole('heading', { name: 'Upload Documents' })).toBeVisible();

    // Upload remaining missing documents
    while (await page.locator('.doc-missing input[type="file"]').count() > 0) {
      const missingInput = page.locator('.doc-missing input[type="file"]').first();
      await missingInput.setInputFiles(samplePdf);
      await expect(page.getByText('Checking your application...', { exact: false }).first()).toHaveCount(0, { timeout: 15000 });
    }

    // Completeness is independent of validation readiness
    await expect(page.locator('.readiness-doc-count')).toContainText('6 / 6');

    // 10. Continue to Review (Step 4)
    await page.getByRole('button', { name: /Continue to Review/ }).click();
    await expect(page.getByRole('heading', { name: 'Review & Validation' })).toBeVisible();
    await expect(page.getByText('First-Time-Right Pre-Validation')).toBeVisible();

    // Verify Proceed to Validation button is clickable
    const proceedBtn = page.getByRole('button', { name: /Proceed to Validation|Revalidate Application/ });
    await expect(proceedBtn).toBeEnabled();
    await proceedBtn.click();

    // Deliberately corrupt PDFs require human review and cannot be submitted
    await expect(page.getByRole('heading', { name: /^Manual Review/, level: 3 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit Application', exact: true })).toBeDisabled();

    expect(errors).toEqual([]);
  });
});
