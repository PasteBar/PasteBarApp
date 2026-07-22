import { settingsStore } from '~/store/settingsStore'
import { themeStore } from '~/store/themeStore'
import { uiStore } from '~/store/uiStore'

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>

export type AnalyticsWindowType = 'main' | 'history' | 'quickpaste'

export type PlausibleCallbackResult = {
  status?: number
}

/** Canonical domain used for explicit SPA pageview URLs in Plausible. */
const APP_ANALYTICS_ORIGIN = 'https://app.pastebar.app'

const STORAGE = {
  dailyActive: 'pb_analytics_daily_active',
  weeklyActive: 'pb_analytics_weekly_active',
  monthlyActive: 'pb_analytics_monthly_active',
  firstOpen: 'pb_analytics_first_open',
  sessionOpenPrefix: 'pb_analytics_session_open_',
  historyCopyDay: 'pb_analytics_day_history_copy',
  clipCopyDay: 'pb_analytics_day_clip_copy',
  textCopyDay: 'pb_analytics_day_text_copy',
  settingsDay: 'pb_analytics_day_settings',
  updateAvailableDay: 'pb_analytics_day_update_available',
  menuPasteDay: 'pb_analytics_day_menu_paste',
  clipStarredDay: 'pb_analytics_day_clip_starred',
  historyStarredDay: 'pb_analytics_day_history_starred',
  searchUsedDay: 'pb_analytics_day_search_used',
} as const

/** In-flight locks so concurrent calls don't spam while waiting for the network callback. */
const pendingLocks = new Set<string>()

/** If Plausible never invokes callback (hung request), allow a later retry. */
const PENDING_LOCK_TIMEOUT_MS = 15_000

function armPendingTimeout(storageKey: string): void {
  window.setTimeout(() => {
    pendingLocks.delete(storageKey)
  }, PENDING_LOCK_TIMEOUT_MS)
}

/** UTC calendar day, e.g. 2026-03-15 */
function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/** ISO week key in UTC, e.g. 2026-W12 (ISO strings do not include week numbers) */
function utcWeekKey(): string {
  const d = new Date()
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/** UTC calendar month, e.g. 2026-03 */
function utcMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

function cleanProps(props: AnalyticsProps): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === '') continue
    out[key] = value
  }
  return out
}

function getDeviceId(): string {
  return themeStore.getState().deviceId || ''
}

/**
 * True only after this webview has loaded settings from the DB (or received a
 * cross-window sync of the analytics preference). Until then, product tracking
 * must not treat the in-memory default as a real opt-in.
 */
export function isAnalyticsPreferenceReady(): boolean {
  try {
    return settingsStore.getState().isAnalyticsPreferenceReady === true
  } catch {
    return false
  }
}

/**
 * User preference (default true after hydrate). When false, no events are sent
 * except explicit consent notifications that use `{ force: true }`.
 *
 * Before settings hydrate, returns **false** (do not send) so opted-out users
 * with a persisted deviceId cannot emit startup events on launch.
 */
export function isAnonymousAnalyticsEnabled(): boolean {
  try {
    if (!isAnalyticsPreferenceReady()) {
      return false
    }
    return settingsStore.getState().isAnonymousAnalyticsEnabled !== false
  } catch {
    return false
  }
}

function resolveOsLabel(): string {
  const { isWindows, isMacOSX, isLinux } = uiStore.getState()
  if (isWindows) return 'Windows'
  if (isMacOSX) return 'macOS'
  if (isLinux) return 'Linux'
  return 'unknown'
}

function buildCommonProps(
  extra?: AnalyticsProps
): Record<string, string | number | boolean> | null {
  const deviceId = getDeviceId()
  if (!deviceId) return null

  return cleanProps({
    deviceId,
    version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'unknown',
    os: resolveOsLabel(),
    ...extra,
  })
}

export type TrackEventOptions = {
  /**
   * Bypass the user's analytics preference (only for consent preference events
   * so we can measure opt-out / opt-in counts).
   */
  force?: boolean
}

/**
 * Plausible invokes callback after the request finishes (logged, ignored, or errored).
 * Only treat 2xx as a confirmed delivery so offline/failed sends can retry later.
 */
function isPlausibleSuccess(result?: PlausibleCallbackResult): boolean {
  const status = result?.status
  if (typeof status !== 'number') {
    // Older script builds may omit status; treat bare callback as success.
    return true
  }
  return status >= 200 && status < 300
}

/**
 * Send a Plausible event with deviceId + version always attached.
 * No-ops until deviceId is ready (avoids (none) property pollution).
 * No-ops when the user has disabled anonymous analytics (unless `force`).
 * onSuccess runs only on confirmed delivery; onFailure when the request fails
 * (so once-per-period helpers can clear in-flight locks and retry later).
 */
export function trackEvent(
  name: string,
  props?: AnalyticsProps,
  onSuccess?: () => void,
  onFailure?: () => void,
  options?: TrackEventOptions
): boolean {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') {
    return false
  }

  if (!options?.force && !isAnonymousAnalyticsEnabled()) {
    return false
  }

  const common = buildCommonProps(props)
  if (!common) return false

  try {
    window.plausible(name, {
      props: common,
      callback: (result?: PlausibleCallbackResult) => {
        try {
          if (isPlausibleSuccess(result)) {
            onSuccess?.()
          } else {
            onFailure?.()
          }
        } catch {
          // ignore storage/callback errors
        }
      },
    })
    return true
  } catch {
    return false
  }
}

/**
 * Manual pageview with deviceId and an explicit URL so React Router paths
 * are never read from a stale window.location.
 */
export function trackPageview(path?: string, props?: AnalyticsProps): boolean {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') {
    return false
  }

  if (!isAnonymousAnalyticsEnabled()) {
    return false
  }

  const common = buildCommonProps({
    ...props,
    ...(path ? { path } : {}),
  })
  if (!common) return false

  try {
    const options: {
      props: Record<string, string | number | boolean>
      u?: string
    } = { props: common }

    if (path) {
      const normalized = path.startsWith('/') ? path : `/${path}`
      options.u = `${APP_ANALYTICS_ORIGIN}${normalized}`
    }

    window.plausible('pageview', options)
    return true
  } catch {
    return false
  }
}

const CONSENT_EVENT_WAIT_MS = 4_000

/**
 * Wait for Plausible callback (or timeout) so consent events are not cut off mid-flight.
 */
function trackConsentEventAndWait(
  name: string,
  preference: 'disabled' | 'enabled'
): Promise<boolean> {
  return new Promise(resolve => {
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      resolve(ok)
    }

    const timer = window.setTimeout(() => finish(true), CONSENT_EVENT_WAIT_MS)

    const queued = trackEvent(
      name,
      { preference },
      () => {
        window.clearTimeout(timer)
        finish(true)
      },
      () => {
        window.clearTimeout(timer)
        // Still resolve: preference change must proceed even if stats are offline
        finish(false)
      },
      { force: true }
    )

    if (!queued) {
      window.clearTimeout(timer)
      finish(false)
    }
  })
}

/**
 * Final event when the user turns analytics **off**.
 * Uses `force: true` and should be awaited **before** saving enabled=false,
 * so no further product events are sent after this preference change.
 */
export function trackAnonymousAnalyticsOptOut(): Promise<boolean> {
  return trackConsentEventAndWait(
    'Anonymous Analytics Opted Out',
    'disabled'
  )
}

/**
 * Event when the user turns analytics **back on**.
 * Uses `force: true` and should be awaited **after** saving enabled=true.
 */
export function trackAnonymousAnalyticsOptIn(): Promise<boolean> {
  return trackConsentEventAndWait('Anonymous Analytics Opted In', 'enabled')
}

function commitLock(storage: Storage, storageKey: string, value: string): void {
  try {
    storage.setItem(storageKey, value)
  } catch {
    // private mode / quota — ignore
  } finally {
    pendingLocks.delete(storageKey)
  }
}

function clearPending(storageKey: string): void {
  pendingLocks.delete(storageKey)
}

/**
 * Fire an event at most once per UTC calendar day (per browser profile).
 * Storage is only written after Plausible confirms delivery (retry-safe offline).
 */
export function trackOncePerDay(
  name: string,
  storageKey: string,
  props?: AnalyticsProps
): boolean {
  try {
    const day = utcDayKey()
    if (localStorage.getItem(storageKey) === day) return false
    if (pendingLocks.has(storageKey)) return false
    pendingLocks.add(storageKey)
    armPendingTimeout(storageKey)

    const queued = trackEvent(
      name,
      { ...props, day },
      () => commitLock(localStorage, storageKey, day),
      () => clearPending(storageKey)
    )

    if (!queued) {
      pendingLocks.delete(storageKey)
    }
    return queued
  } catch {
    pendingLocks.delete(storageKey)
    return trackEvent(name, props)
  }
}

function trackOncePerPeriod(
  name: string,
  storageKey: string,
  periodKey: string,
  props?: AnalyticsProps
): boolean {
  try {
    if (localStorage.getItem(storageKey) === periodKey) return false
    if (pendingLocks.has(storageKey)) return false
    pendingLocks.add(storageKey)
    armPendingTimeout(storageKey)

    const queued = trackEvent(
      name,
      { ...props, period: periodKey },
      () => commitLock(localStorage, storageKey, periodKey),
      () => clearPending(storageKey)
    )

    if (!queued) {
      pendingLocks.delete(storageKey)
    }
    return queued
  } catch {
    pendingLocks.delete(storageKey)
    return trackEvent(name, props)
  }
}

export function trackOnceEver(
  name: string,
  storageKey: string,
  props?: AnalyticsProps
): boolean {
  try {
    if (localStorage.getItem(storageKey) === '1') return false
    if (pendingLocks.has(storageKey)) return false
    pendingLocks.add(storageKey)
    armPendingTimeout(storageKey)

    const queued = trackEvent(
      name,
      props,
      () => commitLock(localStorage, storageKey, '1'),
      () => clearPending(storageKey)
    )

    if (!queued) {
      pendingLocks.delete(storageKey)
    }
    return queued
  } catch {
    pendingLocks.delete(storageKey)
    return trackEvent(name, props)
  }
}

function trackOncePerSession(
  name: string,
  sessionKey: string,
  props?: AnalyticsProps
): boolean {
  try {
    if (sessionStorage.getItem(sessionKey) === '1') return false
    if (pendingLocks.has(sessionKey)) return false
    pendingLocks.add(sessionKey)
    armPendingTimeout(sessionKey)

    const queued = trackEvent(
      name,
      props,
      () => commitLock(sessionStorage, sessionKey, '1'),
      () => clearPending(sessionKey)
    )

    if (!queued) {
      pendingLocks.delete(sessionKey)
    }
    return queued
  } catch {
    pendingLocks.delete(sessionKey)
    return trackEvent(name, props)
  }
}

/**
 * Core retention suite. Call once when deviceId becomes available for a window.
 *
 * How to read in Plausible:
 * - Daily Active count ≈ DAU (1 event / device / UTC day)
 * - Monthly Active count ≈ MAU (1 event / device / UTC month)
 * - Stickiness (DAU/MAU) ≈ Daily Active / Monthly Active over the same range
 * - Weekly Active for WAU
 * - App Open for session frequency (1 / webview session)
 * - First Open for new installs
 */
export function trackSessionAndRetention(
  windowType: AnalyticsWindowType = 'main'
): void {
  if (!getDeviceId()) return

  const base = { window: windowType }

  trackOnceEver('First Open', STORAGE.firstOpen, base)

  trackOncePerSession(
    'App Open',
    `${STORAGE.sessionOpenPrefix}${windowType}`,
    base
  )

  // Primary retention metrics (event counts ≈ unique devices for that period)
  trackOncePerDay('Daily Active', STORAGE.dailyActive, base)
  trackOncePerPeriod('Weekly Active', STORAGE.weeklyActive, utcWeekKey(), base)
  trackOncePerPeriod('Monthly Active', STORAGE.monthlyActive, utcMonthKey(), base)

  if (windowType === 'history') {
    // Keep legacy goal name for existing Plausible dashboards
    trackEvent('History Separate Window', base)
  } else if (windowType === 'quickpaste') {
    trackEvent('Quick Paste Open', base)
  } else {
    trackEvent('App Start', base)
  }
}

// ─── Feature / engagement helpers ───────────────────────────────────────────

export function trackSettingsOpened(section?: string): void {
  trackOncePerDay('Settings Opened', STORAGE.settingsDay, {
    section: section || 'root',
  })
}

export function trackCollectionCreated(): void {
  trackEvent('Collection Created')
}

export function trackClipCreated(itemType?: string): void {
  trackEvent('Clip Created', { itemType: itemType || 'unknown' })
}

export function trackHistoryCopy(): void {
  trackOncePerDay('History Copy', STORAGE.historyCopyDay)
}

export function trackClipCopy(): void {
  trackOncePerDay('Clip Copy', STORAGE.clipCopyDay)
}

export function trackTextCopy(): void {
  trackOncePerDay('Text Copy', STORAGE.textCopyDay)
}

export function trackUpdateAvailable(version?: string): void {
  trackOncePerDay('Update Available', STORAGE.updateAvailableDay, {
    updateVersion: version,
  })
}

export function trackOnboardingCompleted(language?: string): void {
  trackEvent('Onboarding Completed', { language: language || undefined })
}

export function trackTourCompleted(tourName?: string): void {
  trackEvent('Tour Completed', { tour: tourName || undefined })
}

/** Tray / system menu paste or copy without opening the main UI. */
export function trackMenuPasteUsed(): void {
  trackOncePerDay('Menu Item Used', STORAGE.menuPasteDay)
}

/** Power-user: star/favorite a clip (once per UTC day). */
export function trackClipStarred(): void {
  trackOncePerDay('Clip Starred', STORAGE.clipStarredDay)
}

/** Power-user: star/favorite a history item (once per UTC day). */
export function trackHistoryStarred(): void {
  trackOncePerDay('History Starred', STORAGE.historyStarredDay)
}

/** Discovery: search used in history/menu/quick paste (once per UTC day). */
export function trackSearchUsed(): void {
  trackOncePerDay('Search Used', STORAGE.searchUsedDay)
}
