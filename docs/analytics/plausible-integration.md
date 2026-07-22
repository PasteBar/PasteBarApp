# Plausible Analytics Integration Guide

**Product:** PasteBar (Tauri desktop app)  
**Analytics host:** `https://stats.pastebar.app` (self-hosted Plausible)  
**Site domain (Plausible):** `app.pastebar.app`  
**Status:** Production-oriented implementation with retention-friendly custom events  

This document describes the full PasteBar Plausible integration: architecture, device identity, script setup, event catalog, retention methodology (DAU/WAU/MAU), offline-safe throttling, SPA pageviews, and a reusable playbook for wiring the same pattern into other apps.

**Privacy first:** analytics are anonymous and minimal. No clipboard content or personal data is sent to the stats service—only lightweight usage events that help improve PasteBar. See [§13 Privacy and data protection](#13-privacy-and-data-protection).

**Open & transparent for end users:** this document is intentionally complete and public-facing. Anyone may read how analytics work, which events exist, and how to opt out. Nothing here is meant to be a hidden or private internal-only policy.

**User control:** Settings → User Preferences → **Anonymous product analytics** can fully disable event sending. Preference changes emit a single consent event so we can measure opt-out rates (see [§13.6](#136-user-opt-out-and-preference-events)).

---

## Table of contents

1. [Goals and design principles](#1-goals-and-design-principles)
2. [Architecture overview](#2-architecture-overview)
3. [Plausible service setup](#3-plausible-service-setup)
4. [Script installation (desktop / Tauri)](#4-script-installation-desktop--tauri)
5. [Device ID method](#5-device-id-method)
6. [Frontend analytics module](#6-frontend-analytics-module)
7. [Common properties on every event](#7-common-properties-on-every-event)
8. [Retention suite (DAU / WAU / MAU / stickiness)](#8-retention-suite-dau--wau--mau--stickiness)
9. [Complete event catalog](#9-complete-event-catalog)
10. [Where events are wired in the app](#10-where-events-are-wired-in-the-app)
11. [Improvements and edge-case fixes](#11-improvements-and-edge-case-fixes)
12. [Reading metrics in Plausible](#12-reading-metrics-in-plausible)
13. [Privacy and data protection](#13-privacy-and-data-protection)
14. [Verification checklist](#14-verification-checklist)
15. [Reusable playbook for other apps](#15-reusable-playbook-for-other-apps)
16. [Limitations and future upgrades](#16-limitations-and-future-upgrades)
17. [File reference](#17-file-reference)

---

## 1. Goals and design principles

### What we optimize for

| Goal | Approach |
|------|----------|
| Accurate **desktop** usage | Hardware-backed `deviceId`, not cookies alone |
| **DAU / WAU / MAU** without a custom warehouse | Once-per-period custom events (`Daily Active`, etc.) |
| No `(none)` pollution on props | Never send events until `deviceId` is ready |
| No auto pageviews racing React | Manual Plausible script + explicit SPA pageviews |
| Offline resilience | Commit once-per-period locks only after successful Plausible callback |
| Low event volume | High-frequency actions throttled to once/day |
| Multi-window Tauri | Same script + shared persisted `deviceId` in each entry HTML |

### What Plausible is good at here

- Lightweight privacy-friendly event pipeline
- Custom events + custom properties (Business plan on cloud; self-host typically includes props)
- Goals, funnels-ish filtering, property breakdowns

### What Plausible is *not* (alone)

- True **cohort retention** (D1/D7/D30 by install cohort) without export/backend
- Perfect unique-user counts from arbitrary custom prop values in the free UI
- Offline durable queues that retry days later (we only retry while the app is open / next session same period)

---

## 2. Architecture overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tauri webviews (main / history / quickpaste)                       │
│                                                                     │
│  HTML: script.manual.local.js + window stub                         │
│           │                                                         │
│           ▼                                                         │
│  React app                                                          │
│    ├─ invoke('get_device_id')  ──► themeStore.deviceId (persist)    │
│    ├─ useAnalyticsTracking()  ──► session + pageviews               │
│    └─ trackX() helpers        ──► product events                    │
│           │                                                         │
│           ▼                                                         │
│  window.plausible(name, { props, callback, u? })                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS POST /api/event
                                ▼
                    https://stats.pastebar.app
                    (self-hosted Plausible)
                                │
                                ▼
                    Dashboard: app.pastebar.app
```

### Multi-window entry points

| Window | HTML entry | React bootstrap | Analytics |
|--------|------------|-----------------|-----------|
| Main | `packages/pastebar-app-ui/index.html` | `src/main.tsx` → `App.tsx` | Full suite + router pageviews |
| History separate | `history-index.html` | same router via `isHistoryWindow` | Session/retention + pageviews |
| Quick Paste | `quickpaste-index.html` | `quickpaste-main.tsx` → `QuickPasteApp.tsx` | Session + pageview (no router hook) |

Flags set on `window`:

- `window.isMainWindow`
- `window.isHistoryWindow`
- `window.isQuickPasteWindow`

---

## 3. Plausible service setup

### 3.1 Hosting

PasteBar uses a **self-hosted** Plausible instance:

| Setting | Value |
|---------|--------|
| Script CDN path | `https://stats.pastebar.app/js/script.manual.local.js` |
| Events API (default) | `https://stats.pastebar.app/api/event` |
| Site `data-domain` | `app.pastebar.app` |

The domain string is a **logical site ID** in Plausible. It does not need to match the Tauri webview origin (`https://tauri.localhost` / `tauri://localhost`).

### 3.2 Site configuration in Plausible admin

1. Create site with domain: `app.pastebar.app`
2. Enable **custom properties** / dimensions if your plan/host requires it
3. Add **custom event goals** for every named event you care about (see [event catalog](#9-complete-event-catalog))
4. Optionally enable outbound links / file downloads only if relevant (desktop app usually does not need them)

### 3.3 Script extensions used

| Extension | Purpose |
|-----------|---------|
| `manual` | Disables automatic pageview on script load and History API auto-tracking |
| `local` | Allows tracking from localhost-like origins (required for Tauri webviews) |

Full URL:

```text
https://stats.pastebar.app/js/script.manual.local.js
```

**Do not drop `.local`** for Tauri apps, or events may be ignored.

Other common combinations (for other apps):

| Need | Script |
|------|--------|
| Manual + localhost | `script.manual.local.js` |
| Manual + tagged CSS events + local | `script.manual.tagged-events.local.js` |
| Auto pageviews (websites only) | `script.js` or `script.local.js` |

Confirm the file exists on your host (HTTP 200). Self-hosted Plausible generates multi-extension script filenames from the installed version.

### 3.4 CSP / network allowlist (Tauri)

Ensure the webview can load the script and POST events:

- `script-src` / asset loads for `https://stats.pastebar.app`
- `connect-src` for `https://stats.pastebar.app` (and `https://*.pastebar.app` if already present)

PasteBar already allows pastebar hosts in CSP `connect-src` (see `src-tauri/tauri.conf.json`).

---

## 4. Script installation (desktop / Tauri)

### 4.1 Required HTML snippet

Paste into every analytics-enabled entry HTML **before** app JS:

```html
<!-- manual: no auto pageview until deviceId is ready
     local: allow tauri localhost origins -->
<script
  defer
  data-domain="app.pastebar.app"
  src="https://stats.pastebar.app/js/script.manual.local.js"
></script>
<script>
  window.plausible =
    window.plausible ||
    function () {
      ;(window.plausible.q = window.plausible.q || []).push(arguments)
    }
</script>
```

### 4.2 Why the queue stub matters

The stub implements the standard Plausible queue:

```js
function () { (window.plausible.q = window.plausible.q || []).push(arguments) }
```

Calls made before the deferred script loads are buffered and flushed when the real implementation arrives. Without it, early `window.plausible` calls throw or no-op.

### 4.3 TypeScript global typing

`packages/pastebar-app-ui/src/types/window.d.ts`:

```ts
plausible: (
  event: string,
  options?: {
    callback?: (result?: { status?: number }) => void
    props?: Record<string, unknown>
    u?: string // custom URL for pageviews
  }
) => void
```

---

## 5. Device ID method

### 5.1 Source of truth (Rust)

Command: `get_device_id` in `src-tauri/src/main.rs`

```rust
#[tauri::command]
fn get_device_id() -> Result<String, String> {
  match mid::get("PasteBarApp") {
    Ok(id) => Ok(id[..24].to_string()),
    Err(e) => Err(e.to_string()),
  }
}
```

| Detail | Value |
|--------|--------|
| Library | [`mid`](https://crates.io/crates/mid) (machine ID) |
| Salt / app key | `"PasteBarApp"` |
| Length | First **24 characters** of the machine id |
| Stability | Stable per machine/install fingerprint as provided by `mid` |
| Not | A random UUID regenerated each launch |

### 5.2 Frontend storage

| Layer | Location |
|-------|----------|
| Zustand store | `themeStore.deviceId` in `src/store/themeStore.ts` |
| Persistence | `localStorage` key `theme-store` (partialized: includes `deviceId`) |
| Setter | `themeStore.setDeviceId(hwid)` |

### 5.3 Lifecycle

```
App mount
  │
  ├─ themeStore rehydrates from localStorage (may already have deviceId)
  │
  └─ if deviceId === ''
        invoke('get_device_id')
          └─ setDeviceId(id)
                │
                ▼
        analytics may fire (buildCommonProps requires non-empty deviceId)
```

Fetch sites:

- `App.tsx` (main / history windows)
- `QuickPasteApp.tsx` (quick paste window)

### 5.4 Rules for analytics

1. **Never** attach empty `deviceId` — `buildCommonProps()` returns `null` and `trackEvent` no-ops.
2. **Always** wait for `deviceId` before session/pageview tracking (`useAnalyticsTracking`, QuickPaste effects).
3. Treat `deviceId` as a **pseudonymous device key**, not a login user id (see privacy section).

### 5.5 Why not rely on Plausible “unique visitors”?

Plausible’s built-in uniques are typically **daily salt + IP (+ UA)** style. For a desktop app:

- Many users share NATs / VPNs
- Webview UAs are similar
- You need **per-install** identity across windows and days

Custom property `deviceId` + once-per-period events gives a better DAU/MAU proxy for desktop.

---

## 6. Frontend analytics module

### 6.1 Core files

| File | Role |
|------|------|
| `packages/pastebar-app-ui/src/lib/analytics.ts` | All tracking primitives + product helpers |
| `packages/pastebar-app-ui/src/hooks/use-analytics.ts` | React hook: session + SPA pageviews |

### 6.2 Public API surface

```ts
// Core
trackEvent(name, props?, onSuccess?, onFailure?): boolean
trackPageview(path?, props?): boolean
trackOncePerDay(name, storageKey, props?): boolean
trackOnceEver(name, storageKey, props?): boolean
trackSessionAndRetention(windowType): void

// Product helpers (examples)
trackHistoryCopy()
trackMenuPasteUsed()
// ... see full catalog
```

### 6.3 Return value semantics

`trackEvent` returns `true` if the call was **queued/handed to Plausible**, not necessarily stored on the server yet. Once-per-period **locks** only commit inside the **success callback**.

### 6.4 Session bootstrap (main/history)

```ts
// App.tsx
useAnalyticsTracking()
```

Hook behavior when `deviceId` is ready:

1. Once: `trackSessionAndRetention(windowType)`
2. On each unique `pathname + search`: `trackPageview(pathKey)`

### 6.5 Quick Paste bootstrap

No React Router — manual:

```ts
trackSessionAndRetention('quickpaste')
trackPageview('/quickpaste')
```

---

## 7. Common properties on every event

Attached by `buildCommonProps()`:

| Prop | Source | Example |
|------|--------|---------|
| `deviceId` | theme store / hardware id | `a1b2c3...` (24 chars) |
| `version` | build inject `APP_VERSION` | `0.7.0` |
| `os` | uiStore flags | `Windows` / `macOS` / `Linux` / `unknown` |

Additional props by event type:

| Prop | When |
|------|------|
| `window` | Session suite: `main` \| `history` \| `quickpaste` |
| `day` | Once-per-day events (UTC `YYYY-MM-DD`) |
| `period` | Weekly (`2026-W12`) / monthly (`2026-03`) keys |
| `path` | Pageviews (router path) |
| `section` | Settings section slug |
| `itemType` | Clip created |
| `language` | Onboarding |
| `tour` | Tour name |
| `updateVersion` | Updater |

Empty / null / `''` props are stripped before send.

---

## 8. Retention suite (DAU / WAU / MAU / stickiness)

### 8.1 Events fired by `trackSessionAndRetention`

| Event | Cadence | Storage |
|-------|---------|---------|
| `First Open` | Once ever | `localStorage` `pb_analytics_first_open` = `1` |
| `App Open` | Once per webview **session** | `sessionStorage` `pb_analytics_session_open_{window}` |
| `Daily Active` | Once per **UTC day** | `pb_analytics_daily_active` = `YYYY-MM-DD` |
| `Weekly Active` | Once per **UTC ISO week** | `pb_analytics_weekly_active` = `YYYY-Www` |
| `Monthly Active` | Once per **UTC month** | `pb_analytics_monthly_active` = `YYYY-MM` |
| `App Start` | Main window session (every call to suite for main) | no lock (session suite already gates with App Open partially) |
| `History Separate Window` | History window session | — |
| `Quick Paste Open` | Quick Paste window session | — |

Notes:

- `Daily Active` / `Weekly Active` / `Monthly Active` are shared across windows via `localStorage` (good: one DAU per device even if three windows open).
- `App Open` is per window type per session (`sessionStorage` is per webview).

### 8.2 How to interpret counts

Because each device emits **at most one** of each period event:

| Metric | Formula / reading |
|--------|-------------------|
| **DAU** | Count of `Daily Active` events in range |
| **WAU** | Count of `Weekly Active` in range (careful with week boundaries) |
| **MAU** | Count of `Monthly Active` in a calendar month (or rolling export) |
| **Stickiness** | `DAU / MAU` for the same window (classic target ~20%+ for sticky products) |
| **New devices** | Count of `First Open` |
| **Sessions** | Count of `App Open` (multi-window inflates vs pure “app sessions”) |

### 8.3 UTC period keys

All period keys use **UTC** to avoid travel/timezone double-counting:

```ts
// day:   new Date().toISOString().slice(0, 10)  → 2026-03-15
// month: new Date().toISOString().slice(0, 7)   → 2026-03
// week:  ISO week math (YYYY-Www) — not available from ISO date strings alone
```

### 8.4 Offline-safe locks (critical)

Naive pattern (bad):

```ts
plausible('Daily Active', ...)
localStorage.setItem(key, day) // loses day if request never arrives
```

PasteBar pattern (good):

```ts
trackEvent(name, props, () => {
  // only after 2xx (or legacy callback without status)
  localStorage.setItem(key, day)
}, () => {
  // allow retry
  pendingLocks.delete(key)
})
```

Extras:

- **In-flight set** prevents concurrent spam while waiting for the network
- **15s timeout** clears hung in-flight locks so later activity can retry

---

## 9. Complete event catalog

### 9.1 System / retention

| Event name | Cadence | Helper / trigger | Props of note |
|------------|---------|------------------|---------------|
| `pageview` | Every SPA route (main/history) + QP once | `trackPageview` | `path`, `u` URL |
| `First Open` | Once ever | `trackSessionAndRetention` | `window` |
| `App Open` | Once / session / window type | `trackSessionAndRetention` | `window` |
| `Daily Active` | Once / UTC day | `trackSessionAndRetention` | `window`, `day` |
| `Weekly Active` | Once / UTC week | `trackSessionAndRetention` | `period` |
| `Monthly Active` | Once / UTC month | `trackSessionAndRetention` | `period` |
| `App Start` | Main window when suite runs | `trackSessionAndRetention('main')` | `window` |
| `History Separate Window` | History window suite | `trackSessionAndRetention('history')` | `window` |
| `Quick Paste Open` | Quick paste suite | `trackSessionAndRetention('quickpaste')` | `window` |

### 9.2 Acquisition / onboarding

| Event name | Cadence | Helper | Trigger |
|------------|---------|--------|---------|
| `Onboarding Completed` | Unlimited (typically once) | `trackOnboardingCompleted` | Language selected first run |
| `Tour Completed` | Per completion | `trackTourCompleted` | Onboarding tour finished |
| `Update Available` | Once / UTC day | `trackUpdateAvailable` | Updater finds new version |

### 9.3 Core product engagement (throttled)

| Event name | Cadence | Helper | Trigger |
|------------|---------|--------|---------|
| `History Copy` | Once/day | `trackHistoryCopy` | Successful history copy |
| `Clip Copy` | Once/day | `trackClipCopy` | Successful clip copy |
| `Text Copy` | Once/day | `trackTextCopy` | Generic text copy |
| `Menu Item Used` | Once/day | `trackMenuPasteUsed` | Tray/system menu item executed |
| `Search Used` | Once/day | `trackSearchUsed` | Debounced search length > 1 |
| `Settings Opened` | Once/day | `trackSettingsOpened` | Settings routes |

### 9.4 Creation / power features

| Event name | Cadence | Helper | Trigger |
|------------|---------|--------|---------|
| `Collection Created` | Every success | `trackCollectionCreated` | `create_collection` ok |
| `Clip Created` | Every success | `trackClipCreated` | `create_item` success |
| `Clip Starred` | Once/day | `trackClipStarred` | Star clip from context menu |
| `History Starred` | Once/day | `trackHistoryStarred` | Star history item |

### 9.5 Consent / preference (always allowed to measure opt-out)

These events use `force: true` so they can still be sent when the user is turning analytics **off** (last message) or **on** again (first message after re-enable).

| Event name | Cadence | Helper | Trigger |
|------------|---------|--------|---------|
| `Anonymous Analytics Opted Out` | On each disable | `trackAnonymousAnalyticsOptOut` | User turns off the setting |
| `Anonymous Analytics Opted In` | On each enable | `trackAnonymousAnalyticsOptIn` | User turns the setting back on |

Props: `preference` = `disabled` \| `enabled`, plus standard `deviceId`, `version`, `os`.

**How to read opt-out rate:** over a period, compare installs that sent `Anonymous Analytics Opted Out` vs active users (`Daily Active` / `First Open`). This is not perfect cohort math, but it shows how many people choose to disable stats.

### 9.6 Storage key registry

Prefix convention: `pb_analytics_*`

| Key | Purpose |
|-----|---------|
| `pb_analytics_first_open` | First Open |
| `pb_analytics_session_open_{window}` | App Open (sessionStorage) |
| `pb_analytics_daily_active` | Daily Active |
| `pb_analytics_weekly_active` | Weekly Active |
| `pb_analytics_monthly_active` | Monthly Active |
| `pb_analytics_day_history_copy` | History Copy |
| `pb_analytics_day_clip_copy` | Clip Copy |
| `pb_analytics_day_text_copy` | Text Copy |
| `pb_analytics_day_settings` | Settings Opened |
| `pb_analytics_day_update_available` | Update Available |
| `pb_analytics_day_menu_paste` | Menu Item Used |
| `pb_analytics_day_clip_starred` | Clip Starred |
| `pb_analytics_day_history_starred` | History Starred |
| `pb_analytics_day_search_used` | Search Used |

---

## 10. Where events are wired in the app

| Concern | File(s) |
|---------|---------|
| Script tags | `index.html`, `history-index.html`, `quickpaste-index.html` |
| Device id fetch | `App.tsx`, `QuickPasteApp.tsx` |
| Session + pageviews | `hooks/use-analytics.ts`, `App.tsx`, `QuickPasteApp.tsx` |
| History copy/paste | `hooks/use-copypaste-history-item.ts` |
| Clip copy/paste | `hooks/use-copypaste-clip-item.ts` |
| Text copy/paste | `hooks/use-copypaste.ts` |
| Collection created | `hooks/queries/use-collections.ts` |
| Clip created | `hooks/queries/use-items.ts` |
| Settings | `pages/settings/AppSettings.tsx` |
| Onboarding language | `App.tsx` |
| Tours | `layout/Layout.tsx` |
| Update available | `store/settingsStore.ts` |
| Menu/tray use | `App.tsx` listens `execMenuItemById` (emitted from Rust tray handler) |
| Clip starred | `ClipsCardContextMenu.tsx` |
| History starred | `ClipboardHistoryRowContextMenu.tsx` |
| Search | `ClipboardHistoryPage.tsx`, `ClipboardHistoryQuickPastePage.tsx`, `GlobalSearch.tsx` |
| Analytics on/off preference | `UserPreferences.tsx` + `settingsStore.setIsAnonymousAnalyticsEnabled` |

### Tray analytics path

Rust (`main.rs` system tray) emits:

```rust
w.emit("execMenuItemById", item_id)
```

Frontend:

```ts
listen('execMenuItemById', () => trackMenuPasteUsed())
```

This captures **value without opening the UI**.

---

## 11. Improvements and edge-case fixes

Historical problem and fixes implemented:

### 11.1 Auto pageview before `deviceId` (root cause of ~98% `(none)`)

**Before:** `script.tagged-events.local.js` auto-fired pageviews (and History API navigations) with no props. Only rare custom events had `deviceId`.

**After:** `script.manual.local.js` + fire only after `deviceId` is ready + attach props on every event.

### 11.2 Props are per-event, not global users

Plausible does not automatically attach last-known props to future events. Every call must include `deviceId`.

### 11.3 Offline data loss

**Fix:** commit once-per-period storage only in Plausible success callback (2xx). Failure clears pending lock for retry.

### 11.4 Timezone double-counting

**Fix:** UTC day/week/month keys for all period throttles.

### 11.5 SPA URL lag

**Fix:** `trackPageview(path)` sets `u: https://app.pastebar.app{path}` explicitly.

### 11.6 Event volume

**Fix:** copy/paste/search/settings/menu/capture use once-per-day feature flags rather than every keystroke/paste.

### 11.7 Multi-window double DAU

**Mitigated:** period locks live in shared `localStorage` across webviews on the same profile.

---

## 12. Reading metrics in Plausible

### 12.1 Register goals

Site settings → Goals → add custom events for each name in the catalog you care about.

Recommended minimum goals:

- `Daily Active`
- `Weekly Active`
- `Monthly Active`
- `First Open`
- `App Open`
- `Menu Item Used`
- `Search Used`
- `Anonymous Analytics Opted Out`
- `Anonymous Analytics Opted In`

### 12.2 Dashboards to build mentally

| Question | Look at |
|----------|---------|
| How many devices used the app today? | Goal `Daily Active` |
| Stickiness? | `Daily Active` / `Monthly Active` (same range) |
| Are people getting value without opening UI? | `Menu Item Used` |
| Are people engaging (not just launching)? | `History Copy` / `Clip Copy` / `Menu Item Used` vs `Daily Active` |
| New installs? | `First Open` |
| Version mix? | Filter/breakdown prop `version` |
| OS mix? | prop `os` |
| Power users? | `Clip Starred`, `Search Used`, `Collection Created` |
| How many people opt out of analytics? | Goal `Anonymous Analytics Opted Out` |
| How many re-enable analytics? | Goal `Anonymous Analytics Opted In` |

### 12.3 Property `(none)`

If you open **Properties → deviceId** without filtering to a custom event, pageviews and events without that prop show as `(none)`. With this integration, **new** events should all include `deviceId`. Historical traffic before the fix will still pollute long ranges.

### 12.4 Filtering by device

Plausible custom property filters can segment by a known `deviceId` for support/debug. Do not put secrets into props.

---

## 13. Privacy and data protection

> **Important:** PasteBar analytics are designed to be **anonymous, private, and minimal**. We do **not** collect personal content or private clipboard data. The stats service only receives lightweight **usage events** that help us understand which features people actually use, so we can improve the application over time—not to identify individuals or inspect user content.

### 13.0 Open documentation (transparency for end users)

This guide—including the full event catalog, device-id method, retention approach, and opt-out behavior—is written to be **open and fully transparent** for end users, contributors, and reviewers.

- There is no separate “hidden” analytics spec: what you see here is what the app implements.
- Users can verify in Settings that analytics are optional and can be turned off completely.
- Product improvements based on stats should never require collecting private clipboard content.

If this document is published (for example on a website or in the repo), treat it as the public source of truth for PasteBar product analytics.

### 13.1 What we stand for

| Principle | Practice |
|-----------|----------|
| **Anonymous by design** | Events describe *what happened* (e.g. “settings opened”, “daily active”), not *who the user is* in a personal sense |
| **No personal content** | Clipboard text, images, file paths, links, search queries, and similar private material are **never** sent to the stats service |
| **Purpose-limited** | Analytics exist solely to measure product usage and guide product improvements—not advertising, resale, or surveillance |
| **Privacy-friendly tooling** | Self-hosted [Plausible](https://plausible.io/)—no ad trackers, no third-party marketing cookies |
| **Minimal by default** | High-frequency actions are throttled (often once per day) to avoid noisy or excessive telemetry |
| **User choice** | Analytics can be disabled entirely in Settings; after opt-out, no product events are sent |

### 13.2 What is sent (and what is not)

**May be sent (technical / aggregate usage only):**

- Named product events (e.g. `Daily Active`, `Menu Item Used`, `Search Used`)
- Non-sensitive technical props when needed: app `version`, approximate `os`, a pseudonymous `deviceId` for install-level retention
- Screen/route identifiers for in-app navigation (as pageview paths), without user content

**Never sent:**

- Clipboard history contents (text, images, HTML, etc.)
- Search query text (only that search was used, not *what* was searched)
- File paths, URLs copied by the user, account credentials, or messages
- Names, emails, phone numbers, or other personally identifying contact data
- Pairing codes, encryption keys, or peer network details
- Crash dumps or logs that could contain user data

### 13.3 Device identifier (`deviceId`)

The `deviceId` is a **pseudonymous technical fingerprint** of the install/machine (derived from a hardware id, truncated). It is **not** a login, email, or real-world identity.

It exists so that retention metrics (such as daily/monthly activity) can be estimated fairly for a desktop app, without relying on cookies or third-party tracking profiles. Treat it as an opaque technical key in any privacy policy language you publish.

### 13.4 Engineering rules (keep it clean)

When adding new analytics events, always:

1. Ask: *Does this help improve the product?* If not, do not track it.
2. Prefer **boolean / once-per-day** signals over raw counts of private actions.
3. Never attach clipboard content, free-text input, paths, or URLs as event properties.
4. Never log secrets, tokens, pair codes, or peer addresses.
5. Keep this document and the public privacy policy aligned when the event catalog changes.

### 13.5 User-facing summary (optional copy)

You may reuse wording similar to the following in UI, README, or privacy policy:

> PasteBar may collect **anonymous usage statistics** to understand which features are used and to improve the product. These statistics do **not** include your clipboard contents or other private data—only high-level events (for example, that the app was opened or that a feature was used). Analytics are processed with a privacy-focused service and are not used for advertising. You can turn anonymous analytics off at any time in **Settings → User Preferences**. How analytics work is documented openly for full transparency.

### 13.6 User opt-out and preference events

| Item | Detail |
|------|--------|
| **Setting name** | `isAnonymousAnalyticsEnabled` (DB / settings store) |
| **Runtime ready flag** | `isAnalyticsPreferenceReady` — false until this webview hydrates settings from DB |
| **Default (after hydrate)** | `true` (analytics on) if the key was never stored |
| **UI** | Settings → User Preferences → *Anonymous product analytics* (switch) |
| **When off** | `trackEvent` / `trackPageview` no-op; no product usage events leave the device |
| **Before hydrate** | Product tracking is treated as **off** (unknown ≠ enabled) so a saved opt-out cannot race with default-on |
| **Opt-out event** | `Anonymous Analytics Opted Out` — **final event before disable** |
| **Opt-in event** | `Anonymous Analytics Opted In` — **sent after re-enable** |

#### Exact sequence (important)

**User turns analytics OFF**

1. User toggles the switch off in Settings  
2. App sends **`Anonymous Analytics Opted Out`** (`force: true`, waits briefly for delivery/timeout)  
3. Only then is `isAnonymousAnalyticsEnabled` saved as `false`  
4. Preference is **emitted to all live webviews** (`settings-store-sync`) so history / Quick Paste stop immediately  
5. All later product events and pageviews are blocked in every window  

**User turns analytics ON again**

1. User toggles the switch on  
2. `isAnonymousAnalyticsEnabled` is saved as `true` and synced to other webviews  
3. App sends **`Anonymous Analytics Opted In`** (`force: true`)  
4. Normal product analytics resume on subsequent actions  

**App launch (returning opted-out user)**

1. Persisted `deviceId` may be ready immediately  
2. Settings still loading → `isAnalyticsPreferenceReady === false` → **no product events**  
3. After `initSettings`, preference is authoritative; if opted out, still no product events  

Implementation notes:

- `isAnonymousAnalyticsEnabled()` returns **false** until `isAnalyticsPreferenceReady` is true (except consent events with `{ force: true }`).
- `useAnalyticsTracking` / Quick Paste bootstrap wait for **deviceId + preference ready + enabled**.
- Cross-window: `setIsAnonymousAnalyticsEnabled` calls `syncStateUpdate`; listeners on main, history, and quickpaste apply the value.
- Consent events always use `{ force: true }` so they are not blocked by the preference gate.
- Opt-out is **awaited** (callback or ~4s timeout) before persisting “off”.
- Offline: preference still saves even if the stats request fails; we prefer not to trap the user in the toggle.

Register **Anonymous Analytics Opted Out** and **Anonymous Analytics Opted In** as Plausible goals to monitor privacy preference trends.

---


## 14. Verification checklist

### Integration health

- [ ] `https://stats.pastebar.app/js/script.manual.local.js` returns 200
- [ ] Site `app.pastebar.app` exists in Plausible
- [ ] Goals registered for key custom events
- [ ] CSP allows script + `connect-src` to stats host
- [ ] All three HTML entries include manual script + queue stub
- [ ] UI rebuilt so `dist-ui` embeds new HTML (production builds)

### Runtime checks (DevTools / proxy)

1. Launch app, open network panel for the webview.
2. Confirm **no** pageview fires before `deviceId` is set.
3. Confirm event payloads include `props.deviceId`, `props.version`, `props.os`.
4. Navigate routes → pageviews with `u` like `https://app.pastebar.app/history`.
5. Toggle airplane mode → perform action that would set Daily Active → go online and re-open/trigger → event should still be sendable if lock not committed.
6. Tray menu paste → `Menu Item Used` (once/day).
7. Toggle **Anonymous product analytics** off → one `Anonymous Analytics Opted Out` event, then **no** further product events.
8. Toggle it back on → `Anonymous Analytics Opted In`, then events resume.

### Metric sanity

- After 24h of production traffic, `deviceId` property should show low `(none)` on filtered custom goals.
- `Daily Active` ≤ `App Open` roughly (opens can exceed DAU if multi-session).
- `First Open` ≤ `Daily Active` over long ranges.

---

## 15. Reusable playbook for other apps

Use this as a checklist when integrating Plausible into another desktop or SPA product.

### Step A — Plausible site

1. Create site domain (logical name is fine for desktop).
2. Deploy self-host or use plausible.io.
3. Pick script extensions: **manual** if you need custom props before first hit; **local** if origin is localhost-like.

### Step B — Stable device/user key

| App type | Suggested id |
|----------|----------------|
| Desktop (Tauri/Electron) | Hardware machine id (`mid`, `node-machine-id`, etc.), truncated |
| Mobile | Install UUID in secure storage |
| Web logged-in | Internal user id hash (never email) |
| Web anonymous | First-party cookie UUID (know the tradeoffs) |

Persist the id locally. **Gate all analytics on id readiness.**

### Step C — Snippet

Copy the manual + queue stub pattern. Replace:

- `data-domain`
- script host URL
- `APP_ANALYTICS_ORIGIN` for SPA `u` URLs

### Step D — Analytics module

Port `analytics.ts` concepts:

1. `buildCommonProps()` requiring id
2. `trackEvent` with success/failure callbacks
3. `trackOncePerDay` / `Ever` / `Session` with UTC keys + offline-safe locks
4. `trackSessionAndRetention()` for DAU/WAU/MAU suite
5. Product helpers that call those primitives

### Step E — Bootstrap

```ts
// After id is ready
trackSessionAndRetention()
// SPA
onRouteChange(path => trackPageview(path))
```

### Step F — Instrument product value

Prioritize:

1. **Retention:** Daily/Monthly Active  
2. **Aha moment:** the action that delivers core value (for PasteBar: paste / menu use)  
3. **Activation:** first key setup (onboarding, permissions)  
4. **Expansion:** create, search, advanced features  

Throttle noisy events (once/day) unless you need funnels with every step.

### Step G — Plausible goals + review cadence

- Register goals on day one
- Weekly: DAU, stickiness, paste/value rate  
- Monthly: MAU, feature adoption, version/OS mix  

### Step H — Template code sketch (other apps)

```ts
const ORIGIN = 'https://app.example.com'

export function trackEvent(name: string, props?: Record<string, string>, onOk?: () => void) {
  const deviceId = getDeviceId()
  if (!deviceId || typeof window.plausible !== 'function') return false
  window.plausible(name, {
    props: { deviceId, version: APP_VERSION, ...props },
    callback: (r) => {
      if (!r?.status || (r.status >= 200 && r.status < 300)) onOk?.()
    },
  })
  return true
}

export function trackOncePerDay(name: string, key: string) {
  const day = new Date().toISOString().slice(0, 10) // UTC YYYY-MM-DD
  if (localStorage.getItem(key) === day) return false
  return trackEvent(name, { day }, () => localStorage.setItem(key, day))
}

export function trackPageview(path: string) {
  const deviceId = getDeviceId()
  if (!deviceId) return false
  window.plausible('pageview', {
    u: `${ORIGIN}${path.startsWith('/') ? path : `/${path}`}`,
    props: { deviceId, version: APP_VERSION, path },
  })
  return true
}
```

Adapt storage prefixes (`pb_analytics_*` → `yourapp_analytics_*`) to avoid collisions if multiple apps share a profile (rare).

---

## 16. Limitations and future upgrades

| Limitation | Mitigation / next step |
|------------|------------------------|
| No true cohort D1/D7/D30 in Plausible UI | Export Events API / warehouse; store `first_open_at` server-side |
| Event count ≈ unique only if once-per-period holds | Keep throttles; never fire Daily Active unbound |
| Callback may not run if process killed mid-request | Accept small undercount; optional local outbox queue |
| Shared `localStorage` cleared by user | Device appears as new `First Open` if id store wiped but hardware id same—actually deviceId rehydrates from hardware, only period locks reset (DAU may re-fire same day if locks cleared) |
| Multi-user same OS account | Same `deviceId` (acceptable for desktop install metrics) |
| Plausible uniques ≠ deviceId uniques | Prefer custom `Daily Active` over built-in visitors for desktop KPIs |
| Self-host script filename varies by version | Verify URL; pin Plausible version in infra docs |

### Optional upgrades

1. **Local outbox** (IndexedDB) for multi-day offline retry  
2. **Server-side Events API** from Rust for tray actions even if no webview is alive  
3. **`plausible.init({ customProperties })`** if host supports modern script API  
4. **Warehouse** (BigQuery/ClickHouse) from Plausible export for true retention cohorts  
5. **Sampled raw engagement** (e.g. paste count buckets weekly) without flooding  

---

## 17. File reference

### Analytics core

```
packages/pastebar-app-ui/
  index.html
  history-index.html
  quickpaste-index.html
  src/
    lib/analytics.ts
    hooks/use-analytics.ts
    types/window.d.ts
    store/themeStore.ts
    store/settingsStore.ts          # isAnonymousAnalyticsEnabled
    pages/settings/UserPreferences.tsx
    App.tsx
    QuickPasteApp.tsx
    locales/lang/en/settings2.yaml  # preference UI copy
```

### Device id backend

```
src-tauri/src/main.rs   # get_device_id command
```

### Representative call sites

```
src/hooks/use-copypaste-history-item.ts
src/hooks/use-copypaste-clip-item.ts
src/hooks/use-copypaste.ts
src/hooks/queries/use-collections.ts
src/hooks/queries/use-items.ts
src/pages/settings/AppSettings.tsx
src/layout/NavBar.tsx
src/layout/Layout.tsx
src/store/settingsStore.ts
src/pages/main/ClipboardHistoryPage.tsx
src/pages/main/ClipboardHistoryQuickPastePage.tsx
src/pages/components/Dashboard/components/GlobalSearch.tsx
src/pages/components/Dashboard/components/context-menus/ClipsCardContextMenu.tsx
src/pages/components/ClipboardHistory/context-menu/ClipboardHistoryRowContextMenu.tsx
```

### This document

```
docs/analytics/plausible-integration.md
```

---

## Quick reference card

```
Script:     script.manual.local.js @ stats.pastebar.app
Domain:     app.pastebar.app
Device id:  mid::get("PasteBarApp")[:24] → themeStore.deviceId
Gate:       no events without deviceId; no product events if user opted out
Opt-out:    Settings → isAnonymousAnalyticsEnabled=false
            last event: "Anonymous Analytics Opted Out" (force)
Opt-in:     "Anonymous Analytics Opted In" (force)
Pageviews:  manual + u=https://app.pastebar.app{path}
DAU:        goal "Daily Active" (1/device/UTC day)
MAU:        goal "Monthly Active" (1/device/UTC month)
Stickiness: DAU / MAU
Offline:    lock storage only on Plausible 2xx callback
Docs:       open & transparent for end users (this file)
```

---

*Last updated: 2026-03-22 — reflects the PasteBar implementation in `packages/pastebar-app-ui/src/lib/analytics.ts` and related wiring.*
