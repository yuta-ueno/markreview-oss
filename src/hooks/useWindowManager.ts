import { useCallback, useEffect } from 'react'
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

      console.log('WindowManager: Saving window settings (size only):', windowSettings)
      
      updateSettings({ window: windowSettings })
      console.log('WindowManager: Window size settings saved successfully')
    } catch (error) {
      console.error('WindowManager: Failed to save window state:', error)
    }
  }, [updateSettings])

  // Restore window state from settings
  const restoreWindowState = useCallback(async () => {
    try {
      console.log('WindowManager: Restoring window state (size only):', settings.window)
      
      // Try to import Tauri APIs
      const { getCurrentWindow, PhysicalSize } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      const windowSettings = settings.window

      if (windowSettings.maximized) {
        console.log('WindowManager: Maximizing window')
        await window.maximize()
      } else {
        console.log('WindowManager: Setting window size to:', windowSettings.width, 'x', windowSettings.height)
        
        // Only set size - do not modify position at all
        await window.setSize(new PhysicalSize(windowSettings.width, windowSettings.height))
        
        console.log('WindowManager: Window size restored successfully')
      }
      console.log('WindowManager: Window state restoration completed')
      
      // Debug alert disabled to prevent infinite loop
      // if (typeof (globalThis as any).__TAURI__ !== 'undefined') {
      //   alert(`[DEBUG] Window restoration completed successfully`)
      // }
    } catch (error) {
      console.error('WindowManager: Failed to restore window state:', error)
    }
  }, [settings.window])

  // Set up window state management
  useEffect(() => {
    const setupWindowListeners = async () => {
      try {
        console.log('WindowManager: Setting up window listeners')
        console.log('WindowManager: Setting up safe window management')
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const window = getCurrentWindow()
        
        let debounceTimer: number
        let isRestoring = false // Prevent saving during restoration

        const debouncedSave = () => {
          // Don't save if we're in the middle of restoring
          if (isRestoring) {
            console.log('WindowManager: Skipping save during restoration')
            return
          }
          
          console.log('WindowManager: Debounced save triggered')
          clearTimeout(debounceTimer)
          debounceTimer = globalThis.setTimeout(() => {
            saveWindowState()
          }, 2000) // Increased debounce time to 2 seconds for safety
        }
        
        // Listen for window events with safe guards
        const unlistenResize = await window.listen('tauri://resize', () => {
          console.log('WindowManager: Window resize event')
          debouncedSave()
        })
        const unlistenMove = await window.listen('tauri://move', () => {
          console.log('WindowManager: Window move event')
          debouncedSave()
        })
        const unlistenMaximize = await window.listen('tauri://maximize', () => {
          console.log('WindowManager: Window maximize event')
          if (!isRestoring) {
            saveWindowState()
          }
        })
        const unlistenUnmaximize = await window.listen('tauri://unmaximize', () => {
          console.log('WindowManager: Window unmaximize event')
          if (!isRestoring) {
            saveWindowState()
          }
        })

        console.log('WindowManager: Event listeners set up, restoring window state')
        
        // Safely restore window state after setup
        setTimeout(async () => {
          console.log('WindowManager: Starting safe window restoration')
          isRestoring = true
          try {
            await restoreWindowState()
            console.log('WindowManager: Window restoration completed')
          } catch (error) {
            console.error('WindowManager: Window restoration failed:', error)
          } finally {
            // Wait a bit before enabling saving to prevent immediate save triggers
            setTimeout(() => {
              isRestoring = false
              console.log('WindowManager: Window management fully enabled')
            }, 3000)
          }
        }, 500)

        // Cleanup listeners
        return () => {
          console.log('WindowManager: Cleaning up listeners')
          clearTimeout(debounceTimer)
          unlistenResize()
          unlistenMove()
          unlistenMaximize()
          unlistenUnmaximize()
        }
      } catch (error) {
        console.error('WindowManager: Failed to set up listeners:', error)
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