import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('application REST flow and demo regulatory rules', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    // 1. List applications (should include seeded showcase applications)
    const listRes = await fetch(`${base}/api/applications`);
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.equal(listJson.success, true);
    assert.ok(listJson.data.length >= 3);
    const showcase1 = listJson.data.find(a => a.applicationId === 'NS-DEMO-001');
    assert.ok(showcase1);
    assert.equal(showcase1.businessProfile.industryType, 'Food Processing');

    // 2. Create new draft application
    const createRes = await fetch(`${base}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitName: 'Test Bio-Tech Unit' }),
    });
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    assert.equal(createJson.success, true);
    const newId = createJson.data.applicationId;
    assert.ok(newId.startsWith('NS-2026-'));
    assert.equal(createJson.data.status, 'draft');
    assert.equal(createJson.data.currentStep, 1);

    // 3. Update business profile for Food Processing (trigger rule engine)
    const profilePayload = {
      industryType: 'Food Processing',
      location: 'Pune, Maharashtra',
      investmentRange: '₹1 – ₹5 Crore',
      employeeRange: '50 – 200',
      businessStage: 'New Unit',
      description: 'Manufacture of high-quality vacuum-packed food products',
    };

    const updateRes = await fetch(`${base}/api/applications/${newId}/business-profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profilePayload),
    });
    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.success, true);
    assert.equal(updateJson.data.businessProfile.industryType, 'Food Processing');
    assert.equal(updateJson.data.currentStep, 2);

    // Verify generated approvals
    const approvals = updateJson.data.requiredApprovals;
    assert.ok(approvals.length >= 4);
    const fireNoc = approvals.find(a => a.id === 'appr_fp_fire_noc');
    assert.ok(fireNoc);
    assert.equal(fireNoc.ruleId, 'Demo Rule FP-02');
    assert.equal(fireNoc.matchedProfile.industry, 'Food Processing');

    // Verify document reuse: lease/ownership should be used in at least 2 approvals
    const documents = updateJson.data.documents;
    assert.ok(documents.length >= 4);
    const leaseDoc = documents.find(d => d.documentId === 'ownership_lease');
    assert.ok(leaseDoc);
    assert.ok(leaseDoc.usedInApprovals.length >= 2, 'Lease document should be reused in multiple approvals');

    // 4. Update wizard step
    const stepRes = await fetch(`${base}/api/applications/${newId}/current-step`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 3 }),
    });
    assert.equal(stepRes.status, 200);
    const stepJson = await stepRes.json();
    assert.equal(stepJson.data.currentStep, 3);

  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
