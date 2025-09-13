import { useEffect, useRef } from 'react'

interface UseFileWatcherOptions {
  isTauri: boolean
  filePath: string | null
  onChange: (path: string) => void
  debounceMs?: number
  enabled?: boolean
}

// Watches a single file and invokes onChange when it is modified
// Tauri 2.x: uses @tauri-apps/plugin-fs watch API (Cargo feature `watch` enabled)
export function useFileWatcher({
  isTauri,
  filePath,
  onChange,
  debounceMs = 250,
  enabled = true,
}: UseFileWatcherOptions) {
  const timerRef = useRef<number | null>(null)
  const unwatchRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      // Cleanup any previous watcher first
      if (unwatchRef.current) {
        try {
          unwatchRef.current()
        } catch {
          // ignore errors when stopping existing watcher (already stopped)
          void 0
        }
        unwatchRef.current = null
      }

      if (!enabled || !isTauri || !filePath) return

      try {
        const { watch } = await import('@tauri-apps/plugin-fs')

        const stop = await watch(
          filePath,
          (_event) => {
            if (cancelled) return
            // Debounce rapid successive events
            if (timerRef.current) {
              window.clearTimeout(timerRef.current)
            }
            timerRef.current = window.setTimeout(() => {
              onChange(filePath)
            }, debounceMs)
          },
          { recursive: false }
        )
        if (!cancelled) {
          unwatchRef.current = stop
        } else {
          // If effect already cancelled, immediately stop watcher
          try {
            stop()
          } catch {
            // ignore errors when stopping watcher on cancelled setup
            void 0
          }
        }
      } catch (err) {
        // If the fs plugin or watch feature is unavailable, silently skip
        // Caller may provide a manual reload button as a fallback.
        console.warn('File watch setup failed:', err)
      }
    }

    setup()

    return () => {
      cancelled = true
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (unwatchRef.current) {
        try {
          unwatchRef.current()
        } catch {
          // ignore errors when stopping watcher during cleanup
          void 0
        }
        unwatchRef.current = null
      }
    }
  }, [isTauri, filePath, onChange, debounceMs, enabled])
}

export default useFileWatcher
