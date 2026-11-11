# Daymark · The Path ✦

A minimal offline-first, Cantonese-friendly life RPG habit tracker for iPhone and the web.

## Philosophy
**Dream → Main/Side Quest → Tiny Habit → Daily action → XP & Rewards → Graduation.**

The first 21 days are a milestone, not a guarantee that a habit is automatic. Keep your daily action tiny, attach it to an existing routine with an anchor, and graduate it when it feels genuinely automatic.

## Features
- Daily checklist and tiny-minimum actions with routine anchors
- Main/side quests linked to life dreams
- XP and coin economy, rewards conditional on daily progress
- Per-habit monthly calendars and retroactive check-ins
- Habit graduation with historical record retained
- Local JSON export/import, installable offline-first PWA
- Optional fixed calendar reminders via .ics

## Publish on GitHub Pages
1. Open **Settings → Pages** in this repository.
2. For **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/(root)**, then click **Save**.
4. Once published, open https://kycrico.github.io/daymark/ with iPhone Safari → Share → Add to Home Screen.

Later changes pushed to main will trigger site deployment. Open once while connected to update offline cache. If an old version appears, close and reopen the Home Screen app while online.

## Important
- Habit data is stored **locally on the device**, not in the public repository, and does **not sync** across devices.
- Existing local-file or Netlify data will **not automatically transfer** across origins. Export JSON in your previous app first, then import it into the new one.
- Rewards depend on self-control and will **not actually block** Netflix, games, or other apps.
- No background conditional push notifications. Export recurring calendar reminders to receive fixed-time alerts.
- The app doesn't automatically graduate habits or assume everyone forms them in 21 days.

Built with plain HTML, CSS, and JS. No account, no external runtime dependency.
