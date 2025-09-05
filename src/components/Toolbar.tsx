import React, { useRef } from 'react'
import './Toolbar.css'

interface ToolbarProps {
  onNew: () => void
  onOpen: (content: string, filename: string) => void
  onSave: () => void
  onSettings?: () => void
  content: string
  filename: string
  hasUnsavedChanges?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({
  onNew,
  onOpen,
  onSave,
  onSettings,
  content: _content,
  filename,
  hasUnsavedChanges = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleNew = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to create a new document?')
      if (!confirmed) return
    }
    onNew()
  }

  const handleOpenClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Only allow markdown files
    if (!file.name.match(/\.(md|markdown|txt)$/i)) {
      alert('Please select a Markdown file (.md, .markdown, or .txt)')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onOpen(content, file.name)
    }
    reader.onerror = () => {
      alert('Error reading file')
    }
    reader.readAsText(file)

    // Reset the input to allow selecting the same file again
    event.target.value = ''
  }

  const handleSave = () => {
    // Delegate to parent component
    onSave()
  }


  return (
    <div className="toolbar">
      <div className="toolbar-section toolbar-file">
        <button
          className="toolbar-button"
          onClick={handleNew}
          title="New document (Ctrl+N)"
        >
          <span className="toolbar-icon">📄</span>
          New
        </button>
        
        <button
          className="toolbar-button"
          onClick={handleOpenClick}
          title="Open file (Ctrl+O)"
        >
          <span className="toolbar-icon">📁</span>
          Open
        </button>
        
        <button
          className="toolbar-button"
          onClick={handleSave}
          title="Save document (Ctrl+S)"
        >
          <span className="toolbar-icon">💾</span>
          Save
          {hasUnsavedChanges && <span className="unsaved-indicator">*</span>}
        </button>

        <div className="toolbar-separator" />

        {onSettings && (
          <button
            className="toolbar-button"
            onClick={onSettings}
            title="Settings (Ctrl+,)"
          >
            <span className="toolbar-icon">⚙️</span>
            Settings
          </button>
        )}
      </div>

      <div className="toolbar-section toolbar-actions">
      </div>

      <div className="toolbar-section toolbar-info">
        <span className="toolbar-filename">
          {filename || 'Untitled'}
          {hasUnsavedChanges && <span className="unsaved-indicator">*</span>}
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default Toolbar