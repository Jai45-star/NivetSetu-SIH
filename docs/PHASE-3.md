# Phase 3 handoff - First-Time-Right validation

## Outcome and scope

Extended the existing Phase 2 Application model, wizard, upload API, document-reuse checklist and navy/blue shell. No officer review, SLA engine, chatbot, LLM, notifications engine, government integration or Phase 4 tracking was implemented.

Inspection included both manifests, application schema, storage/upload middleware, regulatory rules, draft persistence, wizard state, existing tests and the root reference image. Phase 2's identity requirement accepts PAN OR incorporation; that existing checklist remains intact.

## Dependencies

Backend runtime additions: `pdf-parse` 2.4.5, `tesseract.js` 7.0.0, `@tesseract.js-data/eng` 1.0.0. English OCR data is installed locally for offline execution. No frontend dependency, PDF-generation library, LLM SDK, Python service, queue or database dependency was added.

## Schema and persistence

Document metadata now stores extraction status, method, text availability, confidence category, labeled field values, version and file fingerprint. Validation metadata stores status, timestamp, version and consistent structured issues. Raw extracted text is discarded after field extraction.

Application fields: `validationStatus`, `validationReport`, `validatedAt`, `readinessScore`, `readinessLabel`, `completenessScore`, `submittedAt`, `currentStage`. The saved report includes application summary, component scores, consistency comparisons, issues, limits, rule references and officer-facing summary counts.

Upload presence remains distinct from validation state. `status=uploaded` preserves the existing upload semantics; `validation.status` contains not_uploaded / processing / valid / warning / invalid / manual_review. Processing is displayed during the actual request; no timed animation or pretend backend progress is used.

MongoDB uses Mongoose schema validation and optimistic version checks. Per-application mutations are excluded during validation. Replacement saves new metadata before deleting the old file. Profile edits and removal invalidate reports; replacement clears extraction and document results before re-checking. Requirements that remain unchanged retain their uploaded files. Seed records no longer overwrite existing MongoDB applications or pretend nonexistent files have been uploaded.

The local environment has no configured MONGODB_URI, so live MongoDB persistence was not integration-tested. The existing in-memory fallback retains reports across browser refreshes, but loses records on API restart. Mongoose schema validation and serialization of the complete report were tested. Set MONGODB_URI in backend/.env for durable storage; npm start/dev now load that file.

## Extraction and checks

Pipeline: metadata/content signature -> bounded extraction -> labeled field extraction -> document validators -> cross-document consistency -> profile/completeness -> readiness -> persisted report.

- Normal text PDFs: PDFParse, maximum 30 pages.
- JPG/PNG: local Tesseract English OCR.
- Unreadable/scanned PDFs, parser failures, OCR failures, low confidence, timeout or saturated extraction: manual review, never legal rejection.
- Each child process has a 20-second timeout, 256 MB JavaScript heap setting and is terminated after completion/failure. Maximum two active extraction processes. This is a process boundary, not a hardened OS sandbox.
- Maximum uploaded file size: 10 MB. Maximum extracted text: 120,000 characters. File content signatures, MIME and checklist-required format are compared.
- Explicit labels extract company/applicant names, PAN, reference/registration number, issue/expiry dates and address. Missing values are never invented.
- PAN syntax: five letters, four digits, one letter. Incorporation alternative: readable company name and reference.
- Lease/environment: company name, explicitly present expiry dates, future issue dates and date ordering.
- ISO and named-month dates are supported. Ambiguous numeric dates, invalid calendar dates and conflicting labels become manual-review items. PAN/incorporation do not require expiry.
- Layouts: file/readability checks only. No engineering correctness, fire compliance, signatures or environmental authenticity is claimed.

Cache fingerprints use stored name, file size and modification time plus rule version. Page reloads never perform OCR. Upload checks the new file automatically; unchanged files reuse cached fields while date/consistency checks refresh. Manual re-check re-extracts the selected file; Revalidate Application explicitly re-extracts all files.

Company comparisons use PAN/incorporation as the reference for lease and environmental records. Punctuation, case, PVT/PRIVATE and LTD/LIMITED normalize to equivalent forms; LLP remains a distinct legal form. Near matches are review candidates, not silently accepted matches. Both detected values and their document names appear in the report.

## Readiness formula

Score = round(40 x uploaded/required + 40 x required files without error/manual-review / required + 20 x matched company comparisons / expected company comparisons).

Warnings remain visible and prevent ready status. Any error, warning, manual-review item, incomplete profile or absent checklist prevents readiness, even if rounding would otherwise produce 100 (score capped at 99). Labels: 0-59 Not Ready; 60-84 Needs Fixes; 85-99 Needs Review; 100 Ready to Submit only without unresolved issues.

This is pre-submission readiness, never an approval probability or legal compliance score. Component percentages are weights; the report displays earned points and check counts.

## APIs

| Method | Path | Behavior |
| --- | --- | --- |
| POST | /api/applications/:id/validate | Validate complete application; optional force=true |
| GET | /api/applications/:id/validation | Saved report and stale flag; no extraction |
| POST | /api/applications/:id/documents/:documentId/validate | Re-extract one document and refresh application report |
| POST | /api/applications/:id/submit | Guarded, idempotent internal submission |
| POST | /api/applications/:id/documents | Existing upload route, now validates and refreshes readiness |
| DELETE | /api/applications/:id/documents/:documentId | Existing removal route, now invalidates and refreshes report |

Dates and report freshness use UTC calendar dates. Submission requires a same-day current-version report, no unresolved issues and unchanged available files. Server checks cannot be bypassed by enabling the UI button. Submitted records cannot be edited. Repeat submission preserves submittedAt. Human-readable IDs use NS-year-random suffix; Mongo ObjectId stays internal. Confirmation and reload use /entrepreneur/applications/:id.

## UI

Document rows show icon+text status, accepted formats, actual detected issues, Replace Document, View, Re-check and Remove. Readiness card shows the centralized breakdown and Fix Issues. The issue panel groups Blocking Issues, Warnings and Manual Review, with field values and concrete actions; Fix document focuses its upload row. Step 4 is Review & Validation, including summary, completeness, report, consistency, scope references and gated Submit Application. Confirmation explicitly states that nothing was sent to a government portal. Existing prototype copy implying guaranteed outcomes was removed.

Desktop retains the reference's document-list/readiness-sidebar layout; mobile stacks the panels and keeps actions readable. Screenshots: docs/screenshots/validation-1440.png and validation-375.png. Both were visually compared with the root reference.

## Repeatable demonstration

1. Start API and frontend.
2. In backend, run npm run fixtures:demo. Nine clearly marked sample PDFs are generated in fixtures/documents. The committed pan_ocr.png also exercises real offline OCR in tests.
3. Run npm run seed:demo. It creates four new applications, opens each at Documents, and writes URLs to fixtures/last-demo-run.json. Use DEMO_API_URL for a nondefault local API.
4. Open the combined scenario: missing fire layout, expired lease and mismatched environmental company name.
5. Replace/upload fire_safety_layout.pdf, ownership_lease.pdf and pollution_declaration.pdf from fixtures/documents.
6. Continue to Review, Revalidate Application, inspect 100% and Pre-validation Passed, then Submit Application.
7. Re-run seed:demo for fresh scenarios. Existing drafts are never deleted; the saved manifest points to the newest demonstration set.

| Scenario | Initial score | Corrective action |
| --- | --- | --- |
| Missing Fire Layout | 87% | Upload fire_safety_layout.pdf |
| Expired lease | 93% | Replace with ownership_lease.pdf |
| Company mismatch | 90% | Replace with pollution_declaration.pdf |
| All three combined | 70% | Apply all three fixes |
| Corrected application | 100% | Revalidate and submit internally |

The brief's 68% was illustrative. Scores are calculated consistently; no case-specific score is hardcoded.

## Validation and limits

Backend: 13 tests passed, including real PDF/OCR, expiry, names, malformed/scanned documents, timeouts, file/path safety, cached extraction, replacement cleanup, schema serialization, report reload, guarded/idempotent submission and stale/tampered-file prevention. Backend syntax checks passed.

Frontend: production build and ESLint passed. Browser suite covers Phase 1 routes/navigation, the Phase 2 draft journey updated for real parser failures, the complete Phase 3 fix-and-submit flow, and validation at 1440/1280/1024/768/430/390/375 widths. All 16 browser cases passed. The test setup owns real Express and Vite servers directly, avoiding Windows shell-process teardown.

Known limits: demo-only authentication; no universal document understanding; English image OCR only; image-only PDFs require manual review; no manual override to force an uncertain file through submission; no authenticity or engineering verification. File limits and a child process reduce extraction risk but are not malware scanning. Production use needs real access control and a configured durable database. Live MongoDB connectivity was unavailable locally and is explicitly unverified.

Library references: [PDFParse documentation](https://www.npmjs.com/package/pdf-parse), [Tesseract worker API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md).
