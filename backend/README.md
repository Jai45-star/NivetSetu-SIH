# NiveshSetu API - Phase 3

## Commands

- `npm ci`
- `npm start` or `npm run dev` (loads optional `.env`)
- `npm test`
- `npm run lint`
- `npm run fixtures:demo`
- `npm run seed:demo` (requires a running local API)

Set `PORT` (default 4000) and optionally `MONGODB_URI`. Without MongoDB, records live only in the API process memory. Uploads are stored under `uploads/`; no static upload directory is exposed. Files are served through the existing application/document API. Authentication remains demo-only and must be implemented before use with real sensitive records.

## Validation API

- `POST /api/applications/:id/validate` - full report; optional JSON `{ "force": true }` re-extracts every document.
- `GET /api/applications/:id/validation` - saved report and staleness indicator; does not run OCR.
- `POST /api/applications/:id/documents/:documentId/validate` - re-extracts the selected file and refreshes all checks using cached fields elsewhere.
- `POST /api/applications/:id/submit` - gated, idempotent prototype submission.

Existing profile/checklist/upload/delete APIs remain. Upload and deletion refresh validation. Changes clear application readiness first; replacement clears document extraction and validation before checking the new file. All errors/warnings/manual-review items must be resolved for prototype submission. No override or officer review action exists in this phase.

## Modules

ApplicationService manages drafts, persistence, per-application mutation exclusion, MongoDB optimistic version checks and submission. ApplicationValidationService orchestrates document checks, consistency and report creation. DocumentValidationService handles file validation and specific validators. DocumentExtractionService starts a bounded child process for PDFParse or Tesseract. FieldExtractionService uses explicit labels and regex. ReadinessService owns the 40/40/20 formula. Text/date utilities centralize normalization and parsing.

Extraction accepts at most 10 MB, 30 PDF pages and 120,000 characters. Two extraction processes may run concurrently; a saturated extractor gives a manual-review result that can be retried. Each worker is terminated after 20 seconds. English OCR data is installed locally; no runtime OCR download or LLM call is required. Document text is never stored in MongoDB; only field values, confidence categories, a cache fingerprint and useful report metadata persist.

See `../docs/PHASE-3.md` for detailed validation scope and the repeatable SIH demo.
