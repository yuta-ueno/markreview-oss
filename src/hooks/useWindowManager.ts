import { useCallback, useEffect } from 'react'
import { logger } from '../utils/logger'
import { WindowSettings } from '../types/settings'
import { useSettings } from './useSettings'

export const useWindowManager = () => {
  const { settings, updateSettings } = useSettings()

  // Save current window state to settings
  const saveWindowState = useCallback(async () => {
    try {
      // Try to import Tauri APIs
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      const size = await window.innerSize()
      const isMaximized = await window.isMaximized()

      const windowSettings: WindowSettings = {
        width: size.width,
        height: size.height,
        // Remove position saving - x and y are intentionally omitted
        x: undefined,
        y: undefined,
        maximized: isMaximized,
      }

      logger.debug('WindowManager: Saving window settings (size only):', windowSettings)
      
      updateSettings({ window: windowSettings })
      logger.debug('WindowManager: Window size settings saved successfully')
    } catch (error) {
      logger.error('WindowManager: Failed to save window state:', error)
    }
  }, [updateSettings])

  // Restore window state from settings
  const restoreWindowState = useCallback(async () => {
    try {
      logger.debug('WindowManager: Restoring window state (size only):', settings.window)
      
      // Try to import Tauri APIs
      const { getCurrentWindow, PhysicalSize } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      const windowSettings = settings.window

      if (windowSettings.maximized) {
        logger.debug('WindowManager: Maximizing window')
        await window.maximize()
      } else {
        logger.debug('WindowManager: Setting window size to:', windowSettings.width, 'x', windowSettings.height)
        
        // Only set size - do not modify position at all
        await window.setSize(new PhysicalSize(windowSettings.width, windowSettings.height))
        
        logger.debug('WindowManager: Window size restored successfully')
      }
      logger.debug('WindowManager: Window state restoration completed')
      
      // Debug alert disabled to prevent infinite loop
      // if (typeof (globalThis as any).__TAURI__ !== 'undefined') {
      //   alert(`[DEBUG] Window restoration completed successfully`)
      // }
    } catch (error) {
      logger.error('WindowManager: Failed to restore window state:', error)
    }
  }, [settings.window])

  // Set up window state management
  useEffect(() => {
    const setupWindowListeners = async () => {
      try {
        logger.debug('WindowManager: Setting up window listeners')
        logger.debug('WindowManager: Setting up safe window management')
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const window = getCurrentWindow()
        
        let debounceTimer: number
        let isRestoring = false // Prevent saving during restoration

        const debouncedSave = () => {
          // Don't save if we're in the middle of restoring
          if (isRestoring) {
            logger.debug('WindowManager: Skipping save during restoration')
            return
          }
          
          logger.debug('WindowManager: Debounced save triggered')
          clearTimeout(debounceTimer)
          debounceTimer = globalThis.setTimeout(() => {
            saveWindowState()
          }, 2000) // Increased debounce time to 2 seconds for safety
        }
        
        // Listen for window events with safe guards
        const unlistenResize = await window.listen('tauri://resize', () => {
          logger.debug('WindowManager: Window resize event')
          debouncedSave()
        })
        const unlistenMove = await window.listen('tauri://move', () => {
          logger.debug('WindowManager: Window move event')
          debouncedSave()
        })
        const unlistenMaximize = await window.listen('tauri://maximize', () => {
          logger.debug('WindowManager: Window maximize event')
          if (!isRestoring) {
            saveWindowState()
          }
        })
        const unlistenUnmaximize = await window.listen('tauri://unmaximize', () => {
          logger.debug('WindowManager: Window unmaximize event')
          if (!isRestoring) {
            saveWindowState()
          }
        })

        logger.debug('WindowManager: Event listeners set up, restoring window state')
        
        // Safely restore window state after setup
        setTimeout(async () => {
          logger.debug('WindowManager: Starting safe window restoration')
          isRestoring = true
          try {
            await restoreWindowState()
            logger.debug('WindowManager: Window restoration completed')
          } catch (error) {
            logger.error('WindowManager: Window restoration failed:', error)
          } finally {
            // Wait a bit before enabling saving to prevent immediate save triggers
            setTimeout(() => {
              isRestoring = false
              logger.debug('WindowManager: Window management fully enabled')
            }, 3000)
          }
        }, 500)

        // Cleanup listeners
        return () => {
          logger.debug('WindowManager: Cleaning up listeners')
          clearTimeout(debounceTimer)
          unlistenResize()
          unlistenMove()
          unlistenMaximize()
          unlistenUnmaximize()
        }
      } catch (error) {
        logger.error('WindowManager: Failed to set up listeners:', error)
      }
    }

    let cleanup: (() => void) | undefined

    setupWindowListeners().then((cleanupFn) => {
      cleanup = cleanupFn
    })

    // Save window state before app closes
    const handleBeforeUnload = () => {
      saveWindowState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (cleanup) {
        cleanup()
      }
    }
  }, [saveWindowState, restoreWindowState])

  return {
    saveWindowState,
    restoreWindowState,
  }
}
