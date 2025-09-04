import React, { useState } from 'react'
import { AppSettings, ThemeMode } from '../types/settings'
import ShortcutEditor from './ShortcutEditor'
import './SettingsPanel.css'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => void
  onResetSettings: () => void
}

type SettingsTab = 'general' | 'editor' | 'preview' | 'shortcuts' | 'export'

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  if (!isOpen) return null

  const handleThemeChange = (theme: ThemeMode) => {
    onUpdateSettings({ theme })
  }

  const handleEditorChange = (key: string, value: string | number | boolean) => {
    onUpdateSettings({
      editor: {
        ...settings.editor,
        [key]: value,
      }
    })
  }

  const handlePreviewChange = (key: string, value: string | number | boolean) => {
    onUpdateSettings({
      preview: {
        ...settings.preview,
        [key]: value,
      }
    })
  }

  const handleExportChange = (key: string, value: string | number | boolean) => {
    onUpdateSettings({
      export: {
        ...settings.export,
        [key]: value,
      }
    })
  }

  const handleShortcutChange = (action: string, newShortcut: string) => {
    onUpdateSettings({
      shortcuts: {
        ...settings.shortcuts,
        [action]: newShortcut,
      }
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-tab-content">
            <div className="settings-group">
              <h3>Theme</h3>
              <div className="setting-item">
                <label>Color Theme</label>
                <select 
                  value={settings.theme} 
                  onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                >
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="solarized-light">Solarized Light</option>
                  <option value="solarized-dark">Solarized Dark</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <h3>Application</h3>
              <div className="setting-item">
                <label>Scroll Synchronization</label>
                <input
                  type="checkbox"
                  checked={settings.preview.syncScroll}
                  onChange={(e) => handlePreviewChange('syncScroll', e.target.checked)}
                />
              </div>
            </div>
          </div>
        )

      case 'editor':
        return (
          <div className="settings-tab-content">
            <div className="settings-group">
              <h3>Font & Display</h3>
              <div className="setting-item">
                <label>Font Size</label>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={settings.editor.fontSize}
                  onChange={(e) => handleEditorChange('fontSize', parseInt(e.target.value))}
                />
                <span className="setting-value">{settings.editor.fontSize}px</span>
              </div>

              <div className="setting-item">
                <label>Font Family</label>
                <select
                  value={settings.editor.fontFamily}
                  onChange={(e) => handleEditorChange('fontFamily', e.target.value)}
                >
                  <option value="Monaco, Menlo, Ubuntu Mono, Consolas, monospace">Monaco</option>
                  <option value="'Fira Code', Monaco, Menlo, monospace">Fira Code</option>
                  <option value="'Source Code Pro', Monaco, Menlo, monospace">Source Code Pro</option>
                  <option value="'JetBrains Mono', Monaco, Menlo, monospace">JetBrains Mono</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Tab Size</label>
                <select
                  value={settings.editor.tabSize}
                  onChange={(e) => handleEditorChange('tabSize', parseInt(e.target.value))}
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <h3>Editor Features</h3>
              <div className="setting-item">
                <label>Word Wrap</label>
                <input
                  type="checkbox"
                  checked={settings.editor.wordWrap}
                  onChange={(e) => handleEditorChange('wordWrap', e.target.checked)}
                />
              </div>

              <div className="setting-item">
                <label>Line Numbers</label>
                <input
                  type="checkbox"
                  checked={settings.editor.lineNumbers}
                  onChange={(e) => handleEditorChange('lineNumbers', e.target.checked)}
                />
              </div>

              <div className="setting-item">
                <label>Minimap</label>
                <input
                  type="checkbox"
                  checked={settings.editor.minimap}
                  onChange={(e) => handleEditorChange('minimap', e.target.checked)}
                />
              </div>
            </div>
          </div>
        )

      case 'preview':
        return (
          <div className="settings-tab-content">
            <div className="settings-group">
              <h3>Layout</h3>
              <div className="setting-item">
                <label>Max Width</label>
                <select
                  value={settings.preview.maxWidth}
                  onChange={(e) => handlePreviewChange('maxWidth', 
                    e.target.value === 'full' ? 'full' : parseInt(e.target.value)
                  )}
                >
                  <option value="full">Full Width</option>
                  <option value={600}>600px</option>
                  <option value={800}>800px</option>
                  <option value={1000}>1000px</option>
                  <option value={1200}>1200px</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <h3>Display</h3>
              <div className="setting-item">
                <label>Show Line Numbers</label>
                <input
                  type="checkbox"
                  checked={settings.preview.showLineNumbers}
                  onChange={(e) => handlePreviewChange('showLineNumbers', e.target.checked)}
                />
              </div>

              <div className="setting-item">
                <label>Highlight Current Line</label>
                <input
                  type="checkbox"
                  checked={settings.preview.highlightCurrentLine}
                  onChange={(e) => handlePreviewChange('highlightCurrentLine', e.target.checked)}
                />
              </div>
            </div>
          </div>
        )

      case 'export':
        return (
          <div className="settings-tab-content">
            <div className="settings-group">
              <h3>Export Options</h3>
              <div className="setting-item">
                <label>Default Format</label>
                <select
                  value={settings.export.exportFormat}
                  onChange={(e) => handleExportChange('exportFormat', e.target.value)}
                >
                  <option value="html">HTML</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Include CSS Styling</label>
                <input
                  type="checkbox"
                  checked={settings.export.includeCSS}
                  onChange={(e) => handleExportChange('includeCSS', e.target.checked)}
                />
              </div>

              <div className="setting-item">
                <label>Include Document Title</label>
                <input
                  type="checkbox"
                  checked={settings.export.includeTitle}
                  onChange={(e) => handleExportChange('includeTitle', e.target.checked)}
                />
              </div>
            </div>
          </div>
        )

      case 'shortcuts':
        return (
          <div className="settings-tab-content">
            <div className="settings-group">
              <h3>Keyboard Shortcuts</h3>
              <p className="settings-description">
                Customize keyboard shortcuts for common actions. Use Ctrl+ (Windows/Linux) or Cmd+ (Mac) combinations.
              </p>
              <div className="shortcuts-list">
                {Object.entries(settings.shortcuts).map(([action, shortcut]) => (
                  <ShortcutEditor
                    key={action}
                    action={action}
                    shortcut={shortcut}
                    onUpdate={handleShortcutChange}
                    existingShortcuts={settings.shortcuts}
                  />
                ))}
              </div>
              <div className="settings-group">
                <h4>Tips</h4>
                <ul className="settings-tips">
                  <li>Use modifier keys (Ctrl, Alt, Shift) for better compatibility</li>
                  <li>Click &quot;Record&quot; and press your desired key combination</li>
                  <li>Conflicting shortcuts will be highlighted</li>
                  <li>Use &quot;Reset&quot; to restore default shortcuts</li>
                </ul>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`settings-tab ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              Editor
            </button>
            <button
              className={`settings-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button
              className={`settings-tab ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
            <button
              className={`settings-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              Shortcuts
            </button>
          </div>

          <div className="settings-content">
            {renderTabContent()}
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-button secondary" onClick={onResetSettings}>
            Reset to Defaults
          </button>
          <button className="settings-button primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel