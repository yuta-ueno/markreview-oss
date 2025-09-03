import React, { useState, useEffect, useRef } from 'react'
import './ShortcutEditor.css'

interface ShortcutEditorProps {
  action: string
  shortcut: string
  onUpdate: (action: string, newShortcut: string) => void
  existingShortcuts: Record<string, string>
}

const ShortcutEditor: React.FC<ShortcutEditorProps> = ({
  action,
  shortcut,
  onUpdate,
  existingShortcuts,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRecording && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isRecording])

  const formatKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      'Alt': 'Alt',
      'Shift': 'Shift',
      ' ': 'Space',
    }
    return keyMap[key] || key.toUpperCase()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return

    e.preventDefault()
    e.stopPropagation()

    const keys: string[] = []
    if (e.ctrlKey || e.metaKey) keys.push(e.ctrlKey ? 'Ctrl' : 'Cmd')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')

    if (e.key && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      keys.push(formatKey(e.key))
      
      const newShortcut = keys.join('+')
      
      // Check for conflicts
      const conflict = Object.entries(existingShortcuts)
        .find(([existingAction, existingShortcut]) => 
          existingAction !== action && existingShortcut === newShortcut
        )

      if (conflict) {
        setError(`Shortcut already used by "${conflict[0]}"`)
        setRecordedKeys(keys)
        return
      }

      // Validate shortcut (require modifier key for most actions)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        setError('Single letter shortcuts not allowed. Use Ctrl+, Alt+, or Cmd+ combinations.')
        setRecordedKeys(keys)
        return
      }

      setError('')
      setRecordedKeys(keys)
      setIsRecording(false)
      onUpdate(action, newShortcut)
    } else {
      setRecordedKeys(keys)
    }
  }

  const handleRecord = () => {
    setIsRecording(true)
    setRecordedKeys([])
    setError('')
  }

  const handleReset = () => {
    // Get default shortcut from defaults
    const defaults: Record<string, string> = {
      'new': 'Ctrl+N',
      'open': 'Ctrl+O', 
      'save': 'Ctrl+S',
      'find': 'Ctrl+F',
      'settings': 'Ctrl+,',
    }
    const defaultShortcut = defaults[action] || ''
    onUpdate(action, defaultShortcut)
  }

  const displayShortcut = isRecording 
    ? (recordedKeys.length > 0 ? recordedKeys.join('+') : 'Press keys...')
    : shortcut

  return (
    <div className="shortcut-editor">
      <span className="shortcut-action">
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </span>
      
      <div className="shortcut-input-container">
        <input
          ref={inputRef}
          type="text"
          className={`shortcut-input ${isRecording ? 'recording' : ''} ${error ? 'error' : ''}`}
          value={displayShortcut}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (isRecording) {
              setIsRecording(false)
              setRecordedKeys([])
            }
          }}
          placeholder="Click Record to set shortcut"
          readOnly
        />
        
        <div className="shortcut-actions">
          <button
            className="btn btn-small"
            onClick={handleRecord}
            disabled={isRecording}
          >
            {isRecording ? 'Recording...' : 'Record'}
          </button>
          <button
            className="btn btn-small btn-secondary"
            onClick={handleReset}
            title="Reset to default"
          >
            Reset
          </button>
        </div>
      </div>

      {error && <div className="shortcut-error">{error}</div>}
    </div>
  )
}

export default ShortcutEditor