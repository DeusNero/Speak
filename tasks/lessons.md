# Lessons Learned

## Process
- **Bump the service worker cache version on every push** — without this, phones may keep running the old cached version even after new code is deployed. Increment `CACHE_NAME` in `sw.js` with every commit.
- **Always present a plan and wait for 'Go' — even in Cloud Agent mode** — the agent skipped the plan-and-approve step because Cloud Agent instructions say to work autonomously. Updated `.cursorrules` to explicitly override this. The founder's approval flow always takes priority over agent defaults.

## CSS Specificity (Feb 2026)
- **Inline styles override class-based toggles** — if an element has `opacity:0` in its inline `style=""` attribute, adding a CSS class with `opacity:1` won't work because inline styles have higher specificity. Keep toggled properties (opacity, visibility) in the CSS class only, and only use inline styles for properties that never change or are unique to that element (e.g. a custom `border-top-color`).

## File Splitting (Feb 2026)
- **Lift block-scoped variables to global scope** — when extracting code into separate files, variables defined inside blocks (e.g. `const x = ...` inside an `else{}`) are invisible to other files. Move them to the top level before splitting.
- **Strip wrapper tags after extraction** — sed extraction includes `<style>` and `<script>` tags from the original HTML. Always remove them from the extracted CSS/JS files or they will silently break.
