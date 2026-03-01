# Todo

## Completed
- [x] Move hosting from GitHub Pages to Vercel
- [x] Set up `dev` branch for preview deployments
- [x] Data encryption (AES-GCM) — client-side encryption of all user content in Supabase
- [x] Auth warning + forgot password flow with data loss warning
- [x] Password change in Settings (re-derives key, re-encrypts all data)
- [x] Shared Gemini API key via Supabase `app_config` table
- [x] Offline recording queue — save audio to IndexedDB on transcription failure, auto-retry on reconnect
- [x] New app icon (zen garden sand ripples)
- [x] iOS Safari audio support (audio/mp4 for Gemini transcription)
- [x] iOS PWA meta tags (apple-touch-icon, status-bar-style)
- [x] Fix cross-file variable scoping (storage.js let → var)
- [x] Move build label to Settings only
- [x] Codebase docs cleanup (README, glossary, lessons)

## Open
- [ ] Auth/onboarding rethink — proper welcome screen, sign-in/sign-up split, Google sign-in
- [ ] Full iOS/Safari compatibility audit — hands-on testing of all features on an iPhone
- [ ] Connect custom domain to Vercel (when ready to buy one)
- [ ] Disable GitHub Pages (optional — can keep as backup)
