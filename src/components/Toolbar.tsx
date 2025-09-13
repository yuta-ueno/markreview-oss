import React, { useRef } from 'react'
import {
  FilePlus,
  FolderOpen,
  Save as SaveIcon,
  Settings as SettingsIcon,
  RotateCcw,
  RefreshCw,
  RefreshCcw,
  Edit3,
  Eye,
} from 'lucide-react'
import './Toolbar.css'

interface ToolbarProps {
  onNew: () => void
  onOpen: (content: string, filename: string) => void
  onSave: () => void
  onReload?: () => void | Promise<void>
  autoReloadEnabled?: boolean
  onToggleAutoReload?: () => void
  onSettings?: () => void
  onToggleViewMode?: () => void
  viewMode?: 'split' | 'preview'
  content: string
  filename: string
  hasUnsavedChanges?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({
  onNew,
  onOpen,
  onSave,
  onReload,
  autoReloadEnabled = false,
  onToggleAutoReload,
  onSettings,
  onToggleViewMode,
  viewMode = 'split',
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
          <FilePlus size={16} strokeWidth={2} className="toolbar-icon" />
          New
        </button>
        
        <button
          className="toolbar-button"
          onClick={handleOpenClick}
          title="Open file (Ctrl+O)"
        >
          <FolderOpen size={16} strokeWidth={2} className="toolbar-icon" />
          Open
        </button>
        
        <button
          className="toolbar-button"
          onClick={handleSave}
          title="Save document (Ctrl+S)"
        >
          <SaveIcon size={16} strokeWidth={2} className="toolbar-icon" />
          Save
          {hasUnsavedChanges && <span className="unsaved-indicator">*</span>}
        </button>

        {onReload && (
          <button
            className="toolbar-button"
            onClick={onReload}
            title="Reload from disk"
          >
            <RotateCcw size={16} strokeWidth={2} className="toolbar-icon" />
            Reload
          </button>
        )}

        <div className="toolbar-separator" />

        {onSettings && (
          <button
            className="toolbar-button"
            onClick={onSettings}
            title="Settings (Ctrl+,)"
          >
            <SettingsIcon size={16} strokeWidth={2} className="toolbar-icon" />
            Settings
          </button>
        )}

        {onToggleViewMode && (
          <button
            className="toolbar-button"
            role="switch"
            aria-checked={viewMode === 'preview'}
            aria-label="Preview Only"
            onClick={onToggleViewMode}
            title="Preview Only"
          >
            {viewMode === 'preview' ? (
              <Eye size={16} strokeWidth={2} className="toolbar-icon" />
            ) : (
              <Edit3 size={16} strokeWidth={2} className="toolbar-icon" />
            )}
            Edit On
          </button>
        )}

        {onToggleAutoReload && (
          <button
            className="toolbar-button"
            aria-pressed={autoReloadEnabled}
            onClick={onToggleAutoReload}
            title="Auto Reload"
          >
            {autoReloadEnabled ? (
              <RefreshCw size={16} strokeWidth={2} className="toolbar-icon" />
            ) : (
              <RefreshCcw size={16} strokeWidth={2} className="toolbar-icon" />
            )}
            Auto Reload
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
