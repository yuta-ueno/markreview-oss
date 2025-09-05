import { useEffect, useState, useCallback } from 'react'
import { tauriLogger } from '../utils/logger'
import { APP_CONFIG } from '../utils/constants'

export interface TauriIntegrationResult {
  isTauri: boolean
  readTextFile: ((filePath: string) => Promise<string>) | null
}

export interface UseTauriIntegrationOptions {
  onFileDropped: (filePath: string) => Promise<void>
}

export const useTauriIntegration = ({ onFileDropped }: UseTauriIntegrationOptions): TauriIntegrationResult => {
  const [isTauri, setIsTauri] = useState(false)
  const [readTextFile, setReadTextFile] = useState<((filePath: string) => Promise<string>) | null>(null)

  // Check if running in Tauri environment
  const checkTauriEnvironment = useCallback(() => {
    const hasTauriGlobal = typeof window !== 'undefined' && '__TAURI__' in window
    const hasTauriInternalApi = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__
    const isTauriEnv = hasTauriGlobal || hasTauriInternalApi
    tauriLogger.environmentCheck({
      hasTauriGlobal,
      hasTauriInternalApi,
      isTauriEnv,
      windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(k => k.includes('TAURI')) : []
    })
    return isTauriEnv
  }, [])

  // Initialize Tauri APIs
  const initTauriAPIs = useCallback(async () => {
    try {
      tauriLogger.apiImportAttempt()
      const fsModule = '@tauri-apps/api/fs'
      const fs = await import(/* @vite-ignore */ fsModule)
      setReadTextFile(() => fs.readTextFile)
      tauriLogger.apiImportSuccess()
    } catch (err) {
      console.error('Failed to import Tauri fs API:', err)
    }
  }, [])

  // Setup Tauri file drop event listener
  const setupTauriFileDropListener = useCallback(async () => {
    try {
      tauriLogger.fileDropSetup()
      const eventModule = '@tauri-apps/api/event'
      const { listen } = await import(/* @vite-ignore */ eventModule)
      const unlisten = await listen(APP_CONFIG.TAURI_FILE_DROP_EVENT, (event: any) => {
        tauriLogger.fileDropReceived(event)
        if (event.payload.paths && event.payload.paths.length > 0) {
          const filePath = event.payload.paths[0]
          tauriLogger.processingDroppedFile(filePath)
          onFileDropped(filePath)
        }
      })
      tauriLogger.fileDropComplete()
      
      // Return cleanup function
      return unlisten
    } catch (err) {
      console.error('Failed to setup Tauri file drop listener:', err)
      return null
    }
  }, [onFileDropped])

  // Initialize Tauri features
  const initializeTauriFeatures = useCallback(async () => {
    await initTauriAPIs()
    const unlisten = await setupTauriFileDropListener()
    
    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [initTauriAPIs, setupTauriFileDropListener])

  useEffect(() => {
    // Try initial check
    if (checkTauriEnvironment()) {
      tauriLogger.environmentDetected()
      setIsTauri(true)
      initializeTauriFeatures()
    } else {
      // Retry after a short delay for cases where Tauri isn't ready immediately
      tauriLogger.retryDetection()
      const retryTimer = setTimeout(() => {
        if (checkTauriEnvironment()) {
          tauriLogger.environmentDetected(true)
          setIsTauri(true)
          initializeTauriFeatures()
        } else {
          tauriLogger.environmentNotDetected()
        }
      }, APP_CONFIG.TAURI_RETRY_DELAY)
      
      return () => clearTimeout(retryTimer)
    }
  }, [checkTauriEnvironment, initializeTauriFeatures])

  return {
    isTauri,
    readTextFile,
  }
}