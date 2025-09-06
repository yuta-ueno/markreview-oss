import { useState, useEffect, useCallback } from 'react'
import SplitPane from './components/SplitPane'
import Preview from './components/Preview'
import Editor from './components/Editor'
import Toolbar from './components/Toolbar'
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
import { themeLogger } from './utils/logger'
import { APP_CONFIG } from './utils/constants'
import './App.css'

function App() {
  // Simplified debugging - remove alert dependencies
  console.log('React App Console Log - App started')
  
  
  const [markdownContent, setMarkdownContent] = useState(DEFAULT_CONTENT)
  const [filename, setFilename] = useState('Untitled.md')
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [originalContent, setOriginalContent] = useState(DEFAULT_CONTENT)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Initialize settings and toast
  const { settings, updateSettings, resetSettings } = useSettings()
  const { toasts, removeToast, showToast, success, error, info } = useToast()

  // Setup scroll synchronization (needed before handleContentChange)
  const { editorScrollRef, previewScrollRef, resetScrollPositions } = useScrollSync({
    enabled: settings.preview.syncScroll,
    throttleDelay: APP_CONFIG.THROTTLE_DELAY,
  })

  // Content change handler for file operations
  const handleContentChange = useCallback((content: string, filename: string, filePath: string | null, hasChanges: boolean) => {
    console.log('Content change:', { filename, filePath, contentLength: content.length, hasChanges })
    setMarkdownContent(content)
    setOriginalContent(hasChanges ? originalContent : content)
    setFilename(filename)
    setCurrentFilePath(filePath)
    setHasUnsavedChanges(hasChanges)
    
    // Reset scroll positions when new content is loaded (not for unsaved changes)
    if (!hasChanges) {
      resetScrollPositions()
    }
    
    // DOM-based feedback for file loading
    const statusDiv = document.getElementById('react-status')
    if (statusDiv) {
      statusDiv.innerHTML = `<div style="position:fixed;top:0;left:0;z-index:9999;background:blue;color:white;padding:5px;font-size:12px;">✓ FILE: ${filename}</div>`
      setTimeout(() => {
        if (statusDiv.parentNode) statusDiv.parentNode.removeChild(statusDiv)
      }, 3000)
    }
  }, [originalContent, resetScrollPositions])

  // Tauri integration with file drop support
  const { isTauri, readTextFile } = useTauriIntegration({
    onFileDropped: async (filePath: string) => {
      console.log('File dropped via Tauri:', filePath)
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


  // Setup drag and drop for browser
  const { isDragging, dragAndDropProps } = useDragAndDrop({
    onFilesDrop: handleFileRead,
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
      <div className="app" {...dragAndDropProps}>
        {isDragging && (
          <div className="drag-overlay">
            <div className="drag-message">
              <h2>Drop your Markdown file here</h2>
              <p>Supported formats: .md, .markdown, .txt</p>
            </div>
          </div>
        )}
        
        <div className="app-header">
          <h1>MarkReview</h1>
          <span className="app-env">
            {isTauri ? 'Desktop App' : 'Web Browser'}
          </span>
        </div>
        
        <ErrorBoundary 
          componentName="Toolbar"
          showToast={showToast}
        >
          <Toolbar
            onNew={handleNew}
            onOpen={handleOpen}
            onSave={handleSave}
            onSettings={() => setIsSettingsOpen(true)}
            content={markdownContent}
            filename={filename}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </ErrorBoundary>
        
        <div className="app-content">
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
                    ref={previewScrollRef}
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
                    ref={editorScrollRef}
                  />
                </ErrorBoundary>
              }
              defaultSplit={APP_CONFIG.DEFAULT_SPLIT_RATIO}
              minSize={APP_CONFIG.MIN_PANE_SIZE}
            />
          </ErrorBoundary>
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
