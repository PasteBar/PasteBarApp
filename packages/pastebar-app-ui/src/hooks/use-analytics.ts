import { useEffect, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { useLocation } from 'react-router-dom'

import {
  trackPageview,
  trackSessionAndRetention,
  type AnalyticsWindowType,
} from '~/lib/analytics'
import { settingsStoreAtom, themeStoreAtom } from '~/store'

function resolveWindowType(): AnalyticsWindowType {
  if (typeof window === 'undefined') return 'main'
  if (window.isHistoryWindow) return 'history'
  if (window.isQuickPasteWindow) return 'quickpaste'
  return 'main'
}

/**
 * Tracks session/retention once deviceId + analytics preference are ready,
 * and pageviews on route changes. Mount once near the app root (inside the router).
 *
 * Does not fire until:
 * - hardware/persisted deviceId exists
 * - settings have hydrated (so a saved opt-out cannot be overridden by default-on)
 * - anonymous analytics is enabled
 */
export function useAnalyticsTracking() {
  const { deviceId } = useAtomValue(themeStoreAtom)
  const { isAnalyticsPreferenceReady, isAnonymousAnalyticsEnabled } =
    useAtomValue(settingsStoreAtom)
  const { pathname, search } = useLocation()
  const sessionTrackedRef = useRef(false)
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!deviceId) return
    if (!isAnalyticsPreferenceReady) return
    if (!isAnonymousAnalyticsEnabled) return

    if (!sessionTrackedRef.current) {
      sessionTrackedRef.current = true
      trackSessionAndRetention(resolveWindowType())
    }

    const pathKey = `${pathname}${search || ''}`
    if (lastPathRef.current === pathKey) return
    lastPathRef.current = pathKey
    // Pass explicit path so Plausible never reads a stale window.location
    trackPageview(pathKey)
  }, [
    deviceId,
    isAnalyticsPreferenceReady,
    isAnonymousAnalyticsEnabled,
    pathname,
    search,
  ])
}
