# NiveshSetu · Phase 1

SIH 2026 / SIH26130. First-Time-Right Industrial Approvals.

## Run locally

Requires Node.js 22.12+; verified on Node 24.13.

Frontend: in `frontend`, run `npm ci` then `npm run dev`. Open http://127.0.0.1:5173.
Backend: in `backend`, run `npm ci` then `npm start`. Health endpoint: http://127.0.0.1:4000/api/health.

These are independent processes. The demo frontend makes no API calls.

## Validation

In `frontend`: `npm run build`, `npm run lint`, `npx playwright test`.
Browser tests use installed Google Chrome. Install Chrome or change the Playwright channel and install its browser if using another machine.
In `backend`: `npm test`, `npm run lint`.

Deploy `frontend/dist` with an SPA fallback: unknown document requests must serve `index.html` so refreshing nested routes works. Vite dev and preview already provide this behavior. Backend runs separately. No deployment is configured in this phase.

## Scope

Landing and demo role selection, reusable workspace shell, two static dashboard previews, future route placeholders, and Express health endpoint. Role URLs are public demo views, not protected routes. No passwords, persisted login, submission, review actions, OCR, AI, MongoDB, SLA logic or government integration.

See [Phase 1 handoff](docs/PHASE-1.md) for routes, design decisions, file inventory and verification. Original reference image is preserved in the repository root under its supplied filename.
