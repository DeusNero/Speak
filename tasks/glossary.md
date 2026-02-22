# Glossary & Learnings

- **Toast** — a small, temporary notification that appears briefly on screen (e.g. "Saved", "Error"). Named after toast popping up from a toaster. We use `showToast()` in `app.js` — it creates a div anchored to the bottom-left that auto-disappears after a few seconds.

- **System navigation bar (nav bar)** — the bar at the bottom of Android phones with Back, Home, and Recent Apps buttons. The "back button on the phone itself" = the **Back button** in the nav bar. We intercept it via `popstate` to exit multi-select mode instead of leaving the app.

- **Staging environment** — a separate copy of an app used to safely test changes before deploying to the real (production) app. We planned a `Speak-dev` repo on GitHub Pages for this but haven't set it up yet.

- **Checkbox** — a selectable indicator (square or circular) on a list item. The "circles on the cards" in multi-select mode are circular checkboxes (sometimes called **selection indicators**). Styled with `.select-checkbox` in our CSS.

- **Code-switching** — mixing two languages in the same sentence or conversation (e.g. English words in German speech). Colloquially called **Denglish** for German/English mixing. We handle this in our Gemini AI prompt by explicitly telling it to preserve English words used within German text.

- **Autofill / Autocomplete** — browser feature that suggests previously entered data (names, addresses, card details) when focusing an input field. We suppress it with `autocomplete="off"`, `data-form-type="other"`, and the `readonly` trick (see below).

- **`contenteditable`** — an HTML attribute that makes any element (div, span, etc.) directly editable by the user, like a textarea but preserving the element's styling. We use it on the AI-refined text preview so users can tweak the correction before accepting.

- **`user-select: none`** — a CSS property that prevents text selection on an element. Combined with `-webkit-touch-callout: none` on mobile to stop the OS from showing copy/share/search menus on long-press. We added it to `.capture-card` so multi-select long-press doesn't trigger Android's text selection.

- **Stale flag** — a boolean variable that was set for one context (e.g. habits page) but never cleared when leaving that context, causing incorrect behavior elsewhere. We hit this bug with `_habitsPgDirectCreate` — cancelling the write modal on the habits page left it `true`, so the next save on the main page skipped the habit picker.

- **Network-first (caching strategy)** — a service worker strategy that always tries to fetch from the network first, only falling back to cache if offline. Our `sw.js` uses this — it calls `fetch()` first and only falls back to `caches.match()` on failure. Ensures users get the latest code when connected.

- **Hover modal / Quick edit overlay** — a centered dialog that floats over the current screen with a backdrop blur, as opposed to a full-screen modal that replaces the entire view. We use it for editing habit names, habit entry text, and the Gemini API key input (`#quick-edit-overlay`, `#api-key-overlay`).

- **`popstate` event** — a browser event fired when the user navigates back (e.g. Android back button). We listen for it in `app.js` to close overlays and exit multi-select mode instead of navigating away from the app.

- **Row Level Security (RLS)** — database-level access control in Supabase. We enabled it on the `thoughts`, `habits`, and `habit_entries` tables with a policy that says "only let users read/write rows where `user_id` matches their login." This is why the publishable key being public in our GitHub repo is safe — without logging in, nobody can query anything.

- **Publishable key (anon key)** — the Supabase API key we put in `supabase.js` (`sb_publishable_...`). It's meant to be in client-side code. It replaced the old `eyJ...` JWT format. We use it to initialize the Supabase client, but it can't access any data on its own — RLS blocks everything until a user is authenticated.

- **Upsert** — "insert or update." We use `sb.from('thoughts').upsert(rows, {onConflict:'id'})` in our sync functions. If a thought with that `id` already exists in Supabase, it updates it. If it's new, it inserts it. This way we can call sync on every save without worrying about duplicates.

- **Session token** — after you logged into Speak with your email/password, Supabase gave your browser a token that proves you're authenticated. It auto-refreshes in the background, which is why you'll never see the login screen again during normal use. It's stored in the browser — clearing site data would delete it.

- **CDN (Content Delivery Network)** — we load the Supabase JS library from `cdn.jsdelivr.net` instead of downloading it into our repo. The CDN serves the file from a server near the user for faster loading. That's the `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` in our `index.html`.

- **`readonly` trick** — Samsung's browser ignores `autocomplete="off"` and still shows autofill suggestions (card details, passwords) on input fields. We fixed this by making every input `readonly` with `onfocus="this.removeAttribute('readonly')"`. The browser skips autofill on readonly fields, but the moment you tap to type, readonly is removed and it works normally.

- **Feed view / List view** — the toggle buttons in the top-right of the thoughts and habits pages. Feed view shows full cards with text previews and metadata. List view shows compact single-line items (controlled by the CSS class `list-view` on the card container, which reduces padding and clamps text to one line).

- **Success overlay** — the full-screen checkmark animation with floating particles that appears for 1.6 seconds after saving. We have two color variants: beige (for thoughts, using `radial-gradient(#c8b890, #98885a)`) and green (for habits, using `.success-overlay.green` with `radial-gradient(#7da87a, #4a7248)`). It replaced the "Habit created" toast for habits.

- **Auto-tagging** — when we removed the "What kind of thought?" tag selection page, we needed thoughts to still have a tag for filtering. So now `mood-next` (Save) and `mood-skip` (Skip) both set `currentCapture.tags=['emotion']` automatically before calling `saveCapture()`. The user never has to pick — it's always tagged as "thought."
