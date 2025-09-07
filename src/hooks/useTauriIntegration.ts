import { useEffect, useState, useCallback } from 'react'
import { tauriLogger, logger } from '../utils/logger'
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

  // DOM-based debugging function (proven to work)
  const showDebugInfo = useCallback((_message: string, _type: 'info' | 'success' | 'error' = 'info') => {
    // Debug output removed for production
  }, [])

  // Check if running in Tauri environment
  const checkTauriEnvironment = useCallback(() => {
    const hasTauriGlobal = typeof window !== 'undefined' && '__TAURI__' in window
    const hasTauriInternalApi = typeof window !== 'undefined' && (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
    
    // Check for Tauri environment (dev and production)
    const isDev = window.location.hostname === 'localhost' && window.location.port === '5173'
    const isProd = window.location.protocol === 'tauri:' || window.location.hostname === 'tauri.localhost'
    const isTauriEnv = hasTauriGlobal || hasTauriInternalApi || isDev || isProd
    
    // Environment check (debug output removed for production)
    
    // Environment check completed
    
    tauriLogger.environmentCheck({
      hasTauriGlobal,
      hasTauriInternalApi,
      isTauriEnv,
      windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(k => k.includes('TAURI')) : []
    })
    return isTauriEnv
  }, [])

  // Initialize Tauri APIs using Tauri 2.0 plugin system
  const initTauriAPIs = useCallback(async () => {
    try {
      tauriLogger.apiImportAttempt()
      // Loading Tauri 2.0 FS Plugin
      
      // Use Tauri 2.0 plugin system
      const { readTextFile: pluginReadTextFile } = await import('@tauri-apps/plugin-fs')
      setReadTextFile(() => pluginReadTextFile)
      // Tauri 2.0 FS Plugin loaded successfully
      tauriLogger.apiImportSuccess()
    } catch (err) {
      console.error('Failed to import Tauri fs plugin:', err)
      showDebugInfo(`❌ Failed to load Tauri FS Plugin: ${err}`, 'error')
    }
  }, [showDebugInfo])

  // Setup Tauri file drop event listener using Tauri 2.0 events
  const setupTauriFileDropListener = useCallback(async () => {
    try {
      tauriLogger.fileDropSetup()
      showDebugInfo('📦 Loading Tauri 2.0 Event System...', 'info')
      
      // Use Tauri 2.0 core events
      const { listen } = await import('@tauri-apps/api/event')
      
      showDebugInfo('✅ Tauri 2.0 Event System loaded!', 'success')
      
      // Tauri 2.0: Listen for drag-drop event
      const unlistenDrop = await listen(APP_CONFIG.TAURI_FILE_DROP_EVENT, (event: { payload?: { paths?: string[] } }) => {
        tauriLogger.fileDropReceived(event)
        logger.debug('Tauri drag-drop event received:', event)
        showDebugInfo(`📁 Drag & Drop: ${event.payload?.paths?.[0] || 'unknown'}`, 'success')
        
        // Tauri 2.0 event payload structure
        if (event.payload && event.payload.paths && event.payload.paths.length > 0) {
          const filePath = event.payload.paths[0]
          logger.debug('Processing dropped file:', filePath)
          tauriLogger.processingDroppedFile(filePath)
          onFileDropped(filePath)
        }
      })

      // Optional: Listen for drag-enter/leave for visual feedback
      const unlistenEnter = await listen(APP_CONFIG.TAURI_DRAG_ENTER_EVENT, (event: unknown) => {
        logger.debug('Drag enter:', event)
      })

      const unlistenLeave = await listen(APP_CONFIG.TAURI_DRAG_LEAVE_EVENT, (event: unknown) => {
        logger.debug('Drag leave:', event)
      })
      
      tauriLogger.fileDropComplete()
      showDebugInfo('✅ Drag & Drop listener active!', 'success')
      
      // Return combined cleanup function
      return () => {
        unlistenDrop()
        unlistenEnter()
        unlistenLeave()
      }
    } catch (err) {
      console.error('Failed to setup Tauri file drop listener:', err)
      showDebugInfo(`❌ Failed to setup D&D: ${err}`, 'error')
      return null
    }
  }, [onFileDropped, showDebugInfo])

  // Setup Tauri file args event listener using Tauri 2.0 events
  const setupTauriFileArgsListener = useCallback(async () => {
    try {
      console.log('Setting up Tauri 2.0 file args listener...')
      showDebugInfo('📦 Setting up Tauri 2.0 file association...', 'info')
      
      // Use Tauri 2.0 core events
      const { listen } = await import('@tauri-apps/api/event')
      
      showDebugInfo('✅ Event module imported successfully', 'success')
      
      console.log('Available APP_CONFIG.TAURI_FILE_ARGS_EVENT:', APP_CONFIG.TAURI_FILE_ARGS_EVENT)
      
      const unlisten = await listen(APP_CONFIG.TAURI_FILE_ARGS_EVENT, (event: { payload?: unknown }) => {
        console.log('✅✅✅ TAURI 2.0 FILE ARGS EVENT RECEIVED ✅✅✅:', event)
        console.log('Event payload type:', typeof event.payload)
        console.log('Event payload value:', event.payload)
        
        // Show DOM-based feedback - more prominent
        showDebugInfo(`🎉 FILE ASSOCIATION WORKED! Tauri 2.0 event received: ${JSON.stringify(event.payload)}`, 'success')
        
        if (event.payload && typeof event.payload === 'string') {
          console.log('Processing command line file:', event.payload)
          console.log('Calling onFileDropped with:', event.payload)
          showDebugInfo(`Loading file: ${event.payload.split(/[\\/]/).pop()}`, 'info')
          
          // Call the file handler
          onFileDropped(event.payload)
          
          // Show success feedback
          setTimeout(() => {
            showDebugInfo(`File processing initiated for: ${(event.payload as string).split(/[\\/]/).pop()}`, 'success')
          }, 1000)
        } else {
          console.log('Invalid payload format or empty payload')
          showDebugInfo(`⚠️ Invalid payload: ${typeof event.payload} - ${event.payload}`, 'error')
        }
      })
      
      console.log('Tauri 2.0 file args listener setup complete')
      showDebugInfo('🎯 TAURI 2.0 FILE ASSOCIATION LISTENER IS NOW ACTIVE!', 'success')
      
      // Return cleanup function
      return unlisten
    } catch (err) {
      console.error('Failed to setup Tauri 2.0 file args listener:', err)
      console.error('Error stack:', err)
      showDebugInfo(`❌ CRITICAL: Failed to setup Tauri 2.0 file association: ${err}`, 'error')
      return null
    }
  }, [onFileDropped, showDebugInfo])

  // Initialize Tauri features with Tauri 2.0 approach
  const initializeTauriFeatures = useCallback(async () => {
    showDebugInfo('🚀 Initializing Tauri 2.0 features...', 'info')
    
    await initTauriAPIs()
    const unlistenDrop = await setupTauriFileDropListener()
    const unlistenArgs = await setupTauriFileArgsListener()
    
    // Show final status
    if (unlistenArgs) {
      showDebugInfo('🎯 ALL TAURI 2.0 FEATURES INITIALIZED SUCCESSFULLY!', 'success')
    } else {
      showDebugInfo('⚠️ Some Tauri 2.0 features failed to initialize', 'error')
    }
    
    return () => {
      if (unlistenDrop) {
        unlistenDrop()
      }
      if (unlistenArgs) {
        unlistenArgs()
      }
    }
  }, [initTauriAPIs, setupTauriFileDropListener, setupTauriFileArgsListener, showDebugInfo])

  useEffect(() => {
    showDebugInfo('🔍 Starting Tauri 2.0 environment detection...', 'info')
    
    // Try initial check
    if (checkTauriEnvironment()) {
      tauriLogger.environmentDetected()
      setIsTauri(true)
      initializeTauriFeatures()
    } else {
      // Retry after a short delay for cases where Tauri isn't ready immediately
      tauriLogger.retryDetection()
      showDebugInfo('⏳ Retrying Tauri 2.0 detection...', 'info')
      const retryTimer = setTimeout(() => {
        if (checkTauriEnvironment()) {
          tauriLogger.environmentDetected(true)
          setIsTauri(true)
          initializeTauriFeatures()
        } else {
          tauriLogger.environmentNotDetected()
          showDebugInfo('❌ Tauri 2.0 not detected - running in browser mode', 'info')
        }
      }, APP_CONFIG.TAURI_RETRY_DELAY)
      
      return () => clearTimeout(retryTimer)
    }
  }, [checkTauriEnvironment, initializeTauriFeatures, showDebugInfo])

  return {
    isTauri,
    readTextFile,
  }
}
