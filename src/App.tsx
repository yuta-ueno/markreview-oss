import { useState, useEffect, useCallback } from 'react'
import SplitPane from './components/SplitPane'
import Preview from './components/Preview'
import Editor from './components/Editor'
import Toolbar from './components/Toolbar'
import DragDropOverlay from './components/DragDropOverlay'
import SettingsPanel from './components/SettingsPanel'
import { ToastContainer } from './components/Toast'
import { useDebounce } from './hooks/useDebounce'
import { useScrollSync } from './hooks/useScrollSync'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSettings } from './hooks/useSettings'
import { useToast } from './hooks/useToast'
import { saveAsFile, saveFile, validateFileContent } from './utils/file'
import './App.css'

const DEFAULT_CONTENT = `# Welcome to MarkReview

Start typing your **Markdown** content here!

## Features
- ✅ Live preview
- ✅ Syntax highlighting  
- ✅ GitHub Flavored Markdown
- ✅ Tables, checkboxes, code blocks

## Code Example
\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`)
}
\`\`\`

## Table Example
| Feature | Status |
|---------|--------|
| Editor | ✅ Done |
| Preview | ✅ Done |
| Themes | ✅ Done |

## Task List
- [x] Completed task
- [ ] Pending task

> This is a blockquote example.`

function App() {
  const [isTauri, setIsTauri] = useState(false)
  const [markdownContent, setMarkdownContent] = useState(DEFAULT_CONTENT)
  const [filename, setFilename] = useState('Untitled.md')
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [originalContent, setOriginalContent] = useState(DEFAULT_CONTENT)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Initialize settings and toast
  const { settings, updateSettings, resetSettings } = useSettings()
  const { toasts, removeToast, success, error, info } = useToast()

  // Debounce the markdown content for preview updates (200ms delay)
  const debouncedContent = useDebounce(markdownContent, 200)

  // Setup scroll synchronization
  const { editorScrollRef, previewScrollRef } = useScrollSync({
    enabled: settings.preview.syncScroll,
    throttleDelay: 100,
  })



  // Legacy handleOpen for backward compatibility with Toolbar
  const handleOpen = useCallback((content: string, filename: string) => {
    const validation = validateFileContent(content)
    if (!validation.valid) {
      error(`Cannot open file: ${validation.reason}`)
      return
    }

    setMarkdownContent(content)
    setOriginalContent(content)
    setFilename(filename)
    setCurrentFilePath(null)
    setHasUnsavedChanges(false)
    success(`File "${filename}" opened successfully`)
  }, [error, success])

  const handleSave = useCallback(async () => {
    if (isTauri) {
      if (currentFilePath) {
        // Save to existing file
        const result = await saveFile(markdownContent, currentFilePath, success)
        if (result.success) {
          setOriginalContent(markdownContent)
          setHasUnsavedChanges(false)
        }
      } else {
        // Save as new file
        const result = await saveAsFile(markdownContent, success, filename)
        if (result.success && result.data) {
          setFilename(result.data.filename)
          setCurrentFilePath(result.data.path)
          setOriginalContent(markdownContent)
          setHasUnsavedChanges(false)
        }
      }
    } else {
      // Fallback to browser download
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'document.md'
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setOriginalContent(markdownContent)
      setHasUnsavedChanges(false)
      success(`File "${filename}" saved successfully`)
    }
  }, [isTauri, currentFilePath, markdownContent, filename, success])

  const handleNew = useCallback(() => {
    setMarkdownContent(DEFAULT_CONTENT)
    setOriginalContent(DEFAULT_CONTENT)
    setFilename('Untitled.md')
    setHasUnsavedChanges(false)
  }, [])

  // File handling for drag & drop and browser file input
  const handleFileRead = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return

    // Validate file type
    if (!file.name.match(/\.(md|markdown|txt)$/i)) {
      error('Please select a Markdown file (.md, .markdown, or .txt)')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      error('File is too large (maximum 10MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      handleOpen(content, file.name)
    }
    reader.onerror = () => {
      error('Error reading file')
    }
    reader.readAsText(file)
  }, [handleOpen, error])

  // Trigger file input click for keyboard shortcut
  const triggerFileOpen = useCallback(() => {
    // Create a temporary file input to trigger the open dialog
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt'
    input.style.display = 'none'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileRead([file])
      }
      document.body.removeChild(input)
    }
    
    document.body.appendChild(input)
    input.click()
  }, [handleFileRead])

  // Setup drag and drop
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

  useEffect(() => {
    // Check if running in Tauri environment
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      setIsTauri(true)
    }
  }, [])

  const handleContentChange = useCallback((content: string) => {
    setMarkdownContent(content)
    setHasUnsavedChanges(content !== originalContent)
  }, [originalContent])

  return (
    <div className="app" {...dragAndDropProps}>
      <div className="app-header">
        <h1>MarkReview</h1>
        <span className="app-env">
          {isTauri ? 'Desktop App' : 'Web Browser'}
        </span>
      </div>
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSettings={() => setIsSettingsOpen(true)}
        content={markdownContent}
        filename={filename}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <div className="app-content">
        <SplitPane
          left={<Preview content={debouncedContent} ref={previewScrollRef} />}
          right={
            <Editor
              value={markdownContent}
              onChange={handleContentChange}
              placeholder="Start typing your markdown..."
              ref={editorScrollRef}
            />
          }
          defaultSplit={50}
          minSize={25}
        />
      </div>
      <DragDropOverlay isVisible={isDragging} />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetSettings={resetSettings}
      />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}

export default App
