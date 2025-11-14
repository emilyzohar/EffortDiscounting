<!--
  Project-specific Copilot instructions for the EffortDiscounting experiment
  Keep this short and actionable. Reference important files and concrete examples.
-->

# EffortDiscounting — Copilot instructions

This repository is a small static web experiment with a client-side task flow and a Netlify serverless function that uploads CSV results to S3. Use these notes to make safe, high-impact edits.

1) Big picture
- Frontend: `index.html`, `styles.css`, `script.js` — single-page static UI. No bundler or framework. Script mutates global state and manipulates DOM by element IDs.
- Backend/Upload: `netlify/functions/upload-csv.js` — Netlify Function that receives raw CSV body and uploads to AWS S3 (bucket name: `effortmindset`). Expects AWS credentials via environment variables (see file for `key_id`, `secret_key`).
- Data flow: user interactions -> `trialResults` (array in `script.js`) -> `generateCSV()` -> POST to `/.netlify/functions/upload-csv` (CSV in request body, header `X-Filename` for naming) -> Netlify function -> S3.

2) Key developer workflows (commands & environment)
- Run a smoke test: open `index.html` in a browser (file:// or via a simple static server). The app initializes automatically (`start()` at the bottom of `script.js`).
- Deploy: The project contains Netlify functions. The repo has a suggested deploy flow comment in `script.js`:
  - git add . && git commit -m "msg" && git push
  - npx netlify deploy --prod
  Set the AWS credentials (and other env vars) in Netlify site settings before deploying functions.
- Local functions/dev: use Netlify CLI to test functions locally: `npx netlify dev` (Netlify CLI must be installed). When testing upload flow, watch the browser Network tab for POST to `/.netlify/functions/upload-csv`.

3) Project-specific conventions & patterns
- DOM wiring: `script.js` expects many elements by id (e.g. `receiver`, `easy`, `difficult`, `additionValueEl`, `answers`, `correctAnswer`). When you add or rename an element in `index.html`, add the corresponding `const` lookup at the top of `script.js`.
- Global state: `script.js` uses many top-level variables (e.g. `trialList`, `trialIndex`, `trialResults`, `phase`). Prefer minimally invasive changes that preserve the existing single-file architecture unless you intentionally refactor to modules.
- Phases: app uses `phase = 'practice'` then `'main'`. `generateCSV()` is called for main-phase results and at the end of the run.

4) Integration points & secrets
- `/.netlify/functions/upload-csv` expects a POST with raw CSV in body and optionally header `X-Filename` — the client sets this in `generateCSV()`.
- Hardcoded S3 bucket: `effortmindset` (see `netlify/functions/upload-csv.js`). AWS credentials are read from environment variables `key_id` and `secret_key` in the function; ensure these are configured in Netlify.

5) Common edits examples (copyable guidance)
- Add a new UI text node: 1) add element in `index.html` with an id, 2) create `const myEl = document.getElementById('myId')` at top of `script.js`, 3) update the code that shows/hides elements (follow the pattern used for `receiverEl`, `easyEl`).
- Change CSV filename: client sets header `X-Filename` in `generateCSV()`; the function uses `event.headers['x-filename']`. Keep header lowercase-insensitive behavior in mind.

6) Known quirks and quick fixes (discovered in read-through)
- `buildPracticeTrialList()` currently pushes the 4th practice trial into `trialList` instead of `trialListPractice` (quick fix: change that line to push into `trialListPractice`).
- `additionValueEl` is referenced in `script.js` but not declared at the top with other element lookups — add `const additionValueEl = document.getElementById('additionValueEl');` to the top of `script.js` when modifying UI.
- Many variables are global and the code relies on side effects; when refactoring, preserve call order: `start()` → `showIntroScreen()` → build trial lists → `displayNextTrial()`.

7) When making changes
- Keep changes small and test in a browser. Use the Network tab to verify the upload POST contains CSV text and header `X-Filename`.
- If editing the Netlify function, remember to update Netlify environment variables (AWS credentials) and redeploy functions.

If anything in this summary is unclear or you want the instructions to bias towards automated refactors (module-izing `script.js`, adding unit tests, or wiring a dev server), tell me which direction and I will update this file accordingly.
