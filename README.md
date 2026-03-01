# Speak

A mindful voice journaling PWA with a zen aesthetic. Capture thoughts and track habits through voice or text — designed for low-friction daily reflection.

**[Try it live →](https://speak-henna.vercel.app)**

## What it does

Speak is a personal journaling app that lives on your phone's home screen. Tap to speak, hold to write. Your entries sync to Supabase (encrypted with AES-GCM) so they survive cache clears and device changes.

### Thoughts
Record voice entries or write them manually. Tag entries by mood (1–5) and browse them in a feed or list view.

### Habits
Track recurring habits with a dedicated system. Log entries via voice or text directly from the home screen — double-tap the main button to switch between Thought and Habit mode. Streak tracking shows your consistency with rolling 7-day stats and gentle inactivity nudges.

### AI Refinement
Optionally refine your raw entries with Gemini AI. The original text is preserved — you preview changes and can edit the suggestion before accepting or dismissing. Works for both thoughts and habit entries.

## Design

Zen garden aesthetic with a sand-colored palette, Spectral typography, glassmorphism, and stone-in-sand button effects. The main button breathes with subtle ripple animations. Everything is designed to feel calm and intentional.

## Features

- **Voice capture** with Gemini audio transcription (falls back to Web Speech API)
- **Long-press write mode** (0.8s hold with haptic feedback)
- **Double-tap mode switch** between Thoughts and Habits on the home screen
- **Bilingual** — DE/EN toggle for speech recognition; AI auto-detects language
- **Mood tracking** with 5-level scale
- **Habit streaks** — consecutive days, rolling weekly activity, inactivity indicators
- **Gemini AI refinement** with editable preview/accept/dismiss flow
- **Search** across thoughts and habits
- **Client-side encryption** — AES-GCM encryption of all content before syncing to Supabase
- **Offline recording queue** — audio saved to IndexedDB if transcription fails, auto-retries on reconnect
- **Full data export** as JSON
- **Offline-first** — service worker with network-first caching
- **Installable** as a PWA on any device

## Tech

Pure HTML/CSS/JS — no build step, no bundler.

- Hosted on **Vercel** with automatic deploys from `main`
- **Supabase** for auth, cloud sync, and shared config
- **Web Crypto API** for client-side AES-GCM encryption
- **IndexedDB** for encryption key storage and offline audio queue
- Service worker for offline support
- Gemini API for voice transcription and text refinement
- Installable via `manifest.json`

## Setup

1. Clone or fork this repo
2. Connect to Vercel (or any static host)
3. Set up a Supabase project with `thoughts`, `habits`, `habit_entries`, and `app_config` tables (with RLS enabled)
4. Update `supabase.js` with your project URL and anon key
5. Open on your phone and add to home screen

## Privacy

All user content is encrypted client-side with AES-GCM before being stored in Supabase. The encryption key is derived from the user's password — not even the database admin can read the content. The only external API call is to Gemini for transcription/refinement, and only when the user explicitly triggers it.

## License

Personal project. Feel free to fork and adapt for your own use.
