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

## Terminology
- **Toast** — a small, temporary notification that appears briefly on screen (e.g. "Saved", "Error"). Named after toast popping up from a toaster.
- **System navigation bar (nav bar)** — the bar at the bottom of Android phones with Back, Home, and Recent Apps buttons. The "back button on the phone itself" = the **Back button** in the nav bar.
- **Staging environment** — a separate copy of an app used to safely test changes before deploying to the real (production) app.
- **Checkbox** — a selectable indicator (square or circular) on a list item. The "circles on the cards" in multi-select mode are circular checkboxes (sometimes called **selection indicators**).
- **Code-switching** — mixing two languages in the same sentence or conversation (e.g. English words in German speech). Colloquially called **Denglish** for German/English mixing.
- **Autofill / Autocomplete** — browser feature that suggests previously entered data (names, addresses, card details) when focusing an input field. Suppressed with `autocomplete="off"` and `data-form-type="other"` (the latter targets third-party password managers like Dashlane/1Password).
- **`contenteditable`** — an HTML attribute that makes any element (div, span, etc.) directly editable by the user, like a textarea but preserving the element's styling. Used to let users edit AI-refined text in place.
- **`user-select: none`** — a CSS property that prevents text selection on an element. Combined with `-webkit-touch-callout: none` on mobile to stop the OS from showing copy/share/search menus on long-press.
- **Stale flag** — a boolean variable that was set for one context (e.g. habits page) but never cleared when leaving that context, causing incorrect behavior elsewhere. A common bug pattern with global state flags.
- **Network-first (caching strategy)** — a service worker strategy that always tries to fetch from the network first, only falling back to cache if offline. Ensures users get the latest code when connected, unlike cache-first which prioritizes speed over freshness.
- **Hover modal / Quick edit overlay** — a centered dialog that floats over the current screen with a backdrop blur, as opposed to a full-screen modal that replaces the entire view. Used for quick edits (rename habit, edit entry text) to feel lighter and less disruptive.
- **`popstate` event** — a browser event fired when the user navigates back (e.g. Android back button). Used in SPAs/PWAs to intercept back navigation and perform custom actions like exiting multi-select mode instead of leaving the page.

## Testing
- **Think through test plans before suggesting them** — a test that can't prove anything is worse than no test. Always ask: "What would a passing vs failing result look like? Can I actually distinguish them?" If the answer is no, the test is useless.

## File Splitting (Feb 2026)
- **Lift block-scoped variables to global scope** — when extracting code into separate files, variables defined inside blocks (e.g. `const x = ...` inside an `else{}`) are invisible to other files. Move them to the top level before splitting.
- **Strip wrapper tags after extraction** — sed extraction includes `<style>` and `<script>` tags from the original HTML. Always remove them from the extracted CSS/JS files or they will silently break.
