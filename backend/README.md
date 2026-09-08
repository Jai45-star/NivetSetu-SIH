# NiveshSetu API

Phase 1 Express foundation. Requires Node 22.12+ (tested on Node 24).

Run `npm ci`, then `npm run dev` or `npm start`. Defaults to port 4000; use the `PORT` environment variable to change it. To load a local `.env`, run `node --env-file=.env src/server.js`.

`GET /api/health` returns `{ "success": true, "service": "NiveshSetu API", "status": "healthy" }`.

`npm test` checks the response contract and 404 behavior. `npm run lint` checks the entrypoint syntax.

Structure: config handles environment validation; routes map HTTP paths; controllers return responses; middleware handles unknown routes and errors; app.js composes Express; server.js owns startup and shutdown. Models and services should be added with the first actual business feature, not empty scaffolding.

No database connection, authentication, application submission, government integration, OCR, AI, or business logic is included. The frontend demo does not call this API.
