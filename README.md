# NiveshSetu - Phase 3

First-Time-Right pre-submission validation for the SIH prototype. The Phase 1 design and Phase 2 wizard remain the foundation. No Phase 4 workflows were added.

## Start

Requires Node 22.12+ (tested with Node 24), npm, and Google Chrome for Playwright.

- In `backend`: `npm ci`, then `npm start` (default port 4000).
- In `frontend`: `npm ci`, then `npm run dev` (default port 5173).
- Optional MongoDB: set `MONGODB_URI` in `backend/.env`. Backend start/dev scripts load this file. With no URI, existing in-memory demo behavior remains; browser reloads retain data, API restart does not.

The frontend proxies `/api` to port 4000. Set `API_TARGET` when using a different backend port. No real authentication or government submission is provided.

## Demonstrate

In `backend`, run `npm run fixtures:demo` to regenerate the upload-ready PDFs, then `npm run seed:demo` with the API running. This creates four fresh scenarios and prints their application URLs. Corrected files are in `backend/fixtures/documents`. Re-run the seed command to reset the demonstration with fresh applications; it never deletes user drafts.

See [Phase 3 handoff](docs/PHASE-3.md) for the architecture, API map, formula, test results, demo instructions and limitations.

## Check

Backend: `npm test` and `npm run lint`.
Frontend: `npm run build`, `npm run lint`, `npx playwright test`.

Playwright uses isolated ports 4011 and 5174. Production hosting must serve `frontend/dist/index.html` for nested frontend routes and proxy `/api` to the backend.
