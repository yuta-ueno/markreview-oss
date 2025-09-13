import { useState, useEffect, useCallback, useRef, type RefCallback } from 'react'
import SplitPane from './components/SplitPane'
import Preview from './components/Preview'
import Editor from './components/Editor'
import Toolbar from './components/Toolbar'
import useFileWatcher from './hooks/useFileWatcher'
import SettingsPanel from './components/SettingsPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import { useDebounce } from './hooks/useDebounce'
import { useScrollSync } from './hooks/useScrollSync'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSettings } from './hooks/useSettings'
import { useToast } from './hooks/useToast'
import { useFileOperations, DEFAULT_CONTENT } from './hooks/useFileOperations'
import { useTauriIntegration } from './hooks/useTauriIntegration'
import { useWindowManager } from './hooks/useWindowManager'
import { themeLogger, logger } from './utils/logger'
import { saveSettings as persistSaveSettings } from './utils/settingsPersist'
import { APP_CONFIG } from './utils/constants'
import './App.css'

function App() {
  // Simplified debugging - remove alert dependencies
  logger.log('React App Console Log - App started')
  
  
  const [markdownContent, setMarkdownContent] = useState(DEFAULT_CONTENT)
  const [filename, setFilename] = useState('Untitled.md')
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [originalContent, setOriginalContent] = useState(DEFAULT_CONTENT)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [autoReloadEnabled, setAutoReloadEnabled] = useState(false)

  // Initialize settings and toast
  const { settings, updateSettings, resetSettings } = useSettings()
  // Keep latest settings for exit-time save
  const latestSettingsRef = useRef(settings)
  useEffect(() => {
    latestSettingsRef.current = settings
  }, [settings])
  // Initialize window manager for size persistence
  useWindowManager()
  const { toasts, removeToast, showToast, success, error, info } = useToast()

  // Setup scroll synchronization (ref-based API)
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null)
  const [previewEl, setPreviewEl] = useState<HTMLElement | null>(null)

  const attachEditorRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    editorContainerRef.current = node
    const scroller = node?.querySelector('.cm-scroller') as HTMLElement | null
    setEditorEl(scroller)
  }, [])

  const attachPreviewRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    previewContainerRef.current = node
    const scroller = node?.querySelector('.preview-content') as HTMLElement | null
    setPreviewEl(scroller)
  }, [])

  const { editorScrollRef: hookEditorRef, previewScrollRef: hookPreviewRef, resetScrollPositions } = useScrollSync({
    enabled: settings.preview.syncScroll,
    throttleDelay: APP_CONFIG.THROTTLE_DELAY,
    editorEl,
    previewEl,
  })

  // Compose our local ref with the hook's internal ref for fallback querying
  const editorRefCombined: RefCallback<HTMLDivElement> = useCallback((node) => {
    hookEditorRef(node)
    attachEditorRef(node)
  }, [hookEditorRef, attachEditorRef])

  const previewRefCombined: RefCallback<HTMLDivElement> = useCallback((node) => {
    hookPreviewRef(node)
    attachPreviewRef(node)
  }, [hookPreviewRef, attachPreviewRef])

  // Retry finding CodeMirror scroller after mount since it is created asynchronously
  useEffect(() => {
    const node = editorContainerRef.current
    if (!node || editorEl) return
    let retries = 0
    const maxRetries = 30 // ~3s at 100ms
    const interval = window.setInterval(() => {
      const scroller = node.querySelector('.cm-scroller') as HTMLElement | null
      if (scroller) {
        setEditorEl(scroller)
        window.clearInterval(interval)
      } else if (++retries >= maxRetries) {
        window.clearInterval(interval)
      }
    }, 100)
    return () => window.clearInterval(interval)
  }, [editorEl])

  // Content change handler for file operations
  const handleContentChange = useCallback((content: string, filename: string, filePath: string | null, hasChanges: boolean) => {
    logger.log('Content change:', { filename, filePath, contentLength: content.length, hasChanges })
    setMarkdownContent(content)
    setOriginalContent(hasChanges ? originalContent : content)
    setFilename(filename)
    setCurrentFilePath(filePath)
    setHasUnsavedChanges(hasChanges)
    
    // Reset scroll positions when new content is loaded (not for unsaved changes)
    if (!hasChanges) {
      resetScrollPositions()
      success(`Loaded: ${filename}`)
    }
  }, [originalContent, resetScrollPositions])

  // Tauri integration with file drop support
  const { isTauri, readTextFile } = useTauriIntegration({
    onFileDropped: async (filePath: string) => {
      logger.log('File dropped via Tauri:', filePath)
      // This will be handled by the file operations hook
      await handleTauriFileDrop(filePath)
    }
  })

  // Debounce the markdown content for preview updates
  const debouncedContent = useDebounce(markdownContent, APP_CONFIG.DEBOUNCE_DELAY)

  // File operations hook
  const {
    handleNew,
    handleOpen,
    handleSave,
    handleFileRead,
    handleTauriFileDrop,
    triggerFileOpen,
  } = useFileOperations({
    isTauri,
    markdownContent,
    filename,
    currentFilePath,
    handlers: {
      onSuccess: success,
      onError: error,
    },
    readTextFile,
    onContentChange: handleContentChange,
  })

  // Ensure settings are persisted on app exit (Tauri + Web fallback)
  useEffect(() => {
    let unlistenClose: (() => void) | undefined
    ;(async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const appWindow = getCurrentWindow()
        // Tauri 2: close-requested allows async work before closing
        unlistenClose = await appWindow.onCloseRequested(async (event) => {
          try {
            // Prevent immediate close until we flush settings (API provides preventDefault)
            // Use optional chaining to be defensive across environments
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(event as any)?.preventDefault?.()
          } catch {}
          try {
            await persistSaveSettings(latestSettingsRef.current)
          } catch (e) {
            logger.error('Exit save failed (Tauri):', e)
          }
          try {
            await appWindow.close()
          } catch {}
        })
      } catch {
        // Not running in Tauri; fall back to beforeunload
      }
    })()

    const onBeforeUnload = () => {
      // Best-effort save; browsers may not await this promise
      void persistSaveSettings(latestSettingsRef.current)
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      try { unlistenClose?.() } catch {}
    }
  }, [])

  // Reload the currently opened file from disk while preserving scroll
  const reloadFromDisk = useCallback(async () => {
    if (!isTauri || !currentFilePath || !readTextFile) return

    const preservePreviewScroll = previewEl?.scrollTop ?? 0
    const preserveEditorScroll = editorEl?.scrollTop ?? 0

    try {
      const fresh = await readTextFile(currentFilePath)

      // Skip state updates if content is unchanged
      if (fresh === markdownContent) return

      // Apply content without resetting scroll or showing toasts
      setMarkdownContent(fresh)
      setOriginalContent(fresh)
      setHasUnsavedChanges(false)

      // Restore scroll positions on next frame to avoid flicker
      requestAnimationFrame(() => {
        if (previewEl) previewEl.scrollTop = preservePreviewScroll
        if (editorEl) editorEl.scrollTop = preserveEditorScroll
      })
    } catch (e) {
      logger.error('Failed to reload file from disk', e)
    }
  }, [isTauri, currentFilePath, readTextFile, previewEl, editorEl, markdownContent])

  // Watch current file for external changes (desktop)
  useFileWatcher({
    isTauri,
    filePath: currentFilePath,
    onChange: () => {
      // Debounced in hook; re-read file and update
      reloadFromDisk()
    },
    debounceMs: 250,
    enabled: autoReloadEnabled,
  })


  // Setup drag and drop for browser
  const { isDragging, dragAndDropProps } = useDragAndDrop({
    // In Tauri, file drop is handled by Tauri events to avoid double-processing
    onFilesDrop: isTauri ? undefined : handleFileRead,
    acceptedFileTypes: ['.md', '.markdown', '.txt'],
    onError: (errorMessage) => {
      error(errorMessage)
    },
  })

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNew: handleNew,
    onOpen: triggerFileOpen,
    onSave: handleSave,
    onFind: () => {
      // CodeMirror will handle Ctrl+F internally
      info('Use Ctrl+F to search within the editor')
    },
    onTogglePreview: () => {
      const next = settings.viewMode === 'preview' ? 'split' : 'preview'
      updateSettings({ viewMode: next })
    },
    onToggleSettings: () => setIsSettingsOpen(true),
  }, settings)

  // Apply theme to document root
  useEffect(() => {
    themeLogger.editorThemeUpdate(settings.theme)
    const root = document.documentElement
    
    if (settings.theme === 'auto') {
      // For auto theme, remove data-theme attribute and let CSS media queries handle it
      root.removeAttribute('data-theme')
      themeLogger.themeApplied('auto - removed data-theme attribute')
    } else {
      // For specific themes, set data-theme attribute
      root.setAttribute('data-theme', settings.theme)
      themeLogger.themeApplied(settings.theme, root.getAttribute('data-theme') || undefined)
    }
  }, [settings.theme])


  // Simple content change handler for editor
  const handleEditorContentChange = useCallback((content: string) => {
    setMarkdownContent(content)
    setHasUnsavedChanges(content !== originalContent)
  }, [originalContent])

  return (
    <ErrorBoundary 
      componentName="App"
      showToast={showToast}
    >
      <div className={`app ${settings.viewMode === 'preview' ? 'app--preview-only' : ''}`} {...dragAndDropProps}>
        {isDragging && (
          <div className="drag-overlay">
            <div className="drag-message">
              <h2>Drop your Markdown file here</h2>
              <p>Supported formats: .md, .markdown, .txt</p>
            </div>
          </div>
        )}
        
        {/** Removed top title bar (MarkReview / Desktop App) per request */}
        
        <ErrorBoundary 
          componentName="Toolbar"
          showToast={showToast}
        >
          <Toolbar
            onNew={handleNew}
            onOpen={handleOpen}
            onSave={handleSave}
            onReload={currentFilePath && isTauri ? reloadFromDisk : undefined}
            autoReloadEnabled={autoReloadEnabled}
            onToggleAutoReload={() => setAutoReloadEnabled(v => !v)}
            onSettings={() => setIsSettingsOpen(true)}
            onToggleViewMode={() => updateSettings({ viewMode: settings.viewMode === 'preview' ? 'split' : 'preview' })}
            viewMode={settings.viewMode}
            content={markdownContent}
            filename={filename}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </ErrorBoundary>
        
        <div className="app-content">
          {settings.viewMode === 'split' ? (
            <ErrorBoundary 
              componentName="SplitPane"
              showToast={showToast}
            >
              <SplitPane
                left={
                  <ErrorBoundary 
                    componentName="Preview"
                    showToast={showToast}
                  >
                    <Preview
                      content={debouncedContent}
                      settings={settings}
                      ref={previewRefCombined}
                    />
                  </ErrorBoundary>
                }
                right={
                  <ErrorBoundary 
                    componentName="Editor"
                    showToast={showToast}
                  >
                    <Editor
                      value={markdownContent}
                      onChange={handleEditorContentChange}
                      placeholder={APP_CONFIG.PLACEHOLDERS.EDITOR}
                      settings={settings}
                      ref={editorRefCombined}
                    />
                  </ErrorBoundary>
                }
                defaultSplit={APP_CONFIG.DEFAULT_SPLIT_RATIO}
                minSize={APP_CONFIG.MIN_PANE_SIZE}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary 
              componentName="Preview"
              showToast={showToast}
            >
              <Preview
                content={debouncedContent}
                settings={settings}
                ref={previewRefCombined}
              />
            </ErrorBoundary>
          )}
        </div>

        <ErrorBoundary 
          componentName="SettingsPanel"
          showToast={showToast}
        >
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetSettings={resetSettings}
          />
        </ErrorBoundary>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ErrorBoundary>
  )
}

export default App



