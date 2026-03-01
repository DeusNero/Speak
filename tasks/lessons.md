# Lessons Learned

## Process
- **Bump the service worker cache version on every push** — without this, phones may keep running the old cached version even after new code is deployed. Increment `CACHE_NAME` in `sw.js` with every commit.
- **Always present a plan and wait for 'Go' — even in Cloud Agent mode** — the agent skipped the plan-and-approve step because Cloud Agent instructions say to work autonomously. Updated `.cursorrules` to explicitly override this. The founder's approval flow always takes priority over agent defaults.

## CSS Specificity (Feb 2026)
- **Inline styles override class-based toggles** — if an element has `opacity:0` in its inline `style=""` attribute, adding a CSS class with `opacity:1` won't work because inline styles have higher specificity. Keep toggled properties (opacity, visibility) in the CSS class only, and only use inline styles for properties that never change or are unique to that element (e.g. a custom `border-top-color`).

## Git / Remote Sync
- **Always `git pull` before pushing** — if someone (or another agent session) pushed changes in the meantime, your push will be rejected. Pulling first avoids conflict-heavy rebases.

## AI / Prompts
- **Auto-detect language instead of requiring manual selection** — having the user switch a toggle for AI text correction is bad UX. A single prompt that says "detect the language and correct accordingly" works just as well and removes friction. The toggle is still needed for speech recognition (the Web Speech API requires a language hint), but not for the correction step.
- **Handle code-switching (Denglish) explicitly in the prompt** — German speakers commonly mix in English words (Meeting, Feedback, cool). The AI prompt must explicitly say to preserve these, otherwise it may "correct" them into German equivalents.

## Testing
- **Think through test plans before suggesting them** — a test that can't prove anything is worse than no test. Always ask: "What would a passing vs failing result look like? Can I actually distinguish them?" If the answer is no, the test is useless.

## File Splitting (Feb 2026)
- **Lift block-scoped variables to global scope** — when extracting code into separate files, variables defined inside blocks (e.g. `const x = ...` inside an `else{}`) are invisible to other files. Move them to the top level before splitting.
- **Strip wrapper tags after extraction** — sed extraction includes `<style>` and `<script>` tags from the original HTML. Always remove them from the extracted CSS/JS files or they will silently break.

## Cross-File Variables (Feb 2026)
- **Use `var` instead of `let`/`const` for variables shared across `<script>` files** — `let` and `const` at the top level of a script are scoped to that script's global lexical environment. If one script file crashes or an async callback runs before the declaring script loads, variables declared with `let`/`const` throw `ReferenceError: X is not defined`. Using `var` hoists the variable to `window`, making it always accessible (as `undefined` at worst, never a crash). This specifically broke the app when `offline-queue.js` called `renderCaptures()` via an async IndexedDB callback, which accessed `searchQuery` (declared with `let` in `app.js`).

## Async Code in Multi-File Apps (Feb 2026)
- **Async callbacks in early-loading scripts can fire before later scripts finish** — `offline-queue.js` loaded before `app.js` and `thoughts.js`. Its `oqGetAll().then(renderCaptures)` promise resolved and tried to call code that depended on variables from scripts that hadn't executed yet. When adding async startup code to a file that loads early, guard ALL references to cross-file functions and variables, or move the async call to the last-loading script.

## Debugging Broken Apps (Feb 2026)
- **Inject a visible error reporter before guessing** — when the app is broken and the user can't interact, don't waste time reading code trying to guess the crash point. Add a global `window.onerror` + `unhandledrejection` handler that renders a red bar with the error message, file, and line number directly on screen. One red bar message gives more information than 10 rounds of code analysis. This is now codified in `.cursorrules`.

## Reverting the Wrong Commit (Feb 2026)
- **Identify the actual breaking commit before reverting** — the encryption commit (`bcac635`) was reverted, but the real crash was introduced by the offline queue commit (`ce1aa10`) one commit earlier. The encryption commit was blamed because it was the most recent change, but the bug had been present since the offline queue was added. Always reproduce the issue against each suspect commit before reverting. Use `git bisect` or test each commit's deployed version if possible.
- **Reverting a working commit on top of a broken one doesn't fix anything** — if commit A breaks the app and commit B (on top of A) is fine, reverting B still leaves you with A's bug. The app stays broken and you've now lost B's work for nothing.

## API Keys & Secrets (Feb 2026)
- **Never hardcode secret API keys in frontend code** — anything in JS source files is publicly readable. The Supabase anon key is designed to be public (it's just an address; RLS protects the data). But keys like Gemini API keys must never be committed to the repo.
- **Use Supabase `app_config` table for shared secrets** — store keys like `gemini_api_key` in a Supabase table with RLS set to `authenticated` users only. The app fetches the key on login, so it never appears in source code. Only logged-in users can access it.
- **User-set keys take priority over shared keys** — the shared key is only used as a fallback when the user hasn't configured their own in Settings. This lets power users use their own key without being overridden.
- **To rotate a shared key** — update the row in Supabase SQL Editor: `UPDATE app_config SET value = 'NEW_KEY' WHERE key = 'gemini_api_key';`. No code deploy needed.
