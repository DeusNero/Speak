# Todo

## Critical
- [ ] Move Speak to its own domain OR add cloud backup — currently shares deusnero.github.io with Schwubbi, which means uninstalling one PWA can wipe data for both apps
- [ ] Add automatic cloud backup (e.g. Supabase) so data doesn't live only in localStorage

## Infrastructure
- [ ] Move hosting from GitHub Pages to Vercel — gives custom domain, automatic deploys on git push, no more manual service worker version bumping, better PWA headers. Steps: connect GitHub repo to Vercel, point custom domain (e.g. speakapp.io), done. Data stays in Supabase, nothing else changes.

## Setup
- [ ] Create `Speak-dev` staging app — second GitHub repo (`DeusNero/Speak-dev`), GitHub Pages enabled, install as separate PWA on phone for testing before pushing to production. Reason: testing always happens on mobile, so we need a safe place to push and verify new features without risking breaking the real app and its data.
