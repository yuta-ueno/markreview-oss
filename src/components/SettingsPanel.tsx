import React, { useMemo, useState } from 'react'
import { AppSettings, ThemeMode } from '../types/settings'
import ShortcutEditor from './ShortcutEditor'
import './SettingsPanel.css'
import { isProBuild } from '../pro'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => void
  onResetSettings: () => void
}

type SettingsTab = 'general' | 'editor' | 'shortcuts'

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  // Hooks must run unconditionally; compute pro flag before any early return
  const proBuild = useMemo(() => isProBuild(), [])

  if (!isOpen) return null

  const handleThemeChange = (theme: ThemeMode) => {
    onUpdateSettings({ theme })
  }

  // proBuild computed above to satisfy rules-of-hooks

  const handleEditorChange = (key: string, value: string | number | boolean) => {
    onUpdateSettings({
      editor: {
        ...settings.editor,
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
          <div className="settings-main">
            <div className="settings-section">
              <h3 className="settings-section-title">Appearance</h3>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <div className="settings-item-title">Color Theme</div>
                  <div className="settings-item-description">Set the overall appearance of the application</div>
                </div>
                <div className="settings-item-control">
                  <select 
                    className="settings-select"
                    value={settings.theme} 
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                  >
                    <option value="auto">Auto (System)</option>
                    <option value="github-light">GitHub Light</option>
                    <option value="github-dark">GitHub Dark</option>
                    {proBuild && (
                      <>
                        <option value="solarized-light">Solarized Light</option>
                        <option value="solarized-dark">Solarized Dark</option>
                        <option value="nord">Nord</option>
                        <option value="monokai">Monokai</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )

      case 'editor':
        return (
          <div className="settings-main">
            <div className="settings-section">
              <h3 className="settings-section-title">Font & Display</h3>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <div className="settings-item-title">Font Size</div>
                  <div className="settings-item-description">Adjust the font size of the editor</div>
                </div>
                <div className="settings-item-control">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      className="settings-range"
                      min="8"
                      max="32"
                      value={settings.editor.fontSize}
                      onChange={(e) => handleEditorChange('fontSize', parseInt(e.target.value))}
                    />
                    <span className="setting-value">{settings.editor.fontSize}px</span>
                  </div>
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <div className="settings-item-title">Font Family</div>
                  <div className="settings-item-description">Select the font family used in the editor</div>
                </div>
                <div className="settings-item-control">
                  <select
                    className="settings-select"
                    value={settings.editor.fontFamily}
                    onChange={(e) => handleEditorChange('fontFamily', e.target.value)}
                  >
                    <option value="Monaco, Menlo, Ubuntu Mono, Consolas, monospace">Monaco</option>
                    <option value="'Fira Code', Monaco, Menlo, monospace">Fira Code</option>
                    <option value="'Source Code Pro', Monaco, Menlo, monospace">Source Code Pro</option>
                    <option value="'JetBrains Mono', Monaco, Menlo, monospace">JetBrains Mono</option>
                  </select>
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <div className="settings-item-title">Tab Size</div>
                  <div className="settings-item-description">Number of spaces used for indentation</div>
                </div>
                <div className="settings-item-control">
                  <select
                    className="settings-select"
                    value={settings.editor.tabSize}
                    onChange={(e) => handleEditorChange('tabSize', parseInt(e.target.value))}
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                    <option value={8}>8 spaces</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Editor Features</h3>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <div className="settings-item-title">Word Wrap</div>
                  <div className="settings-item-description">Automatically wrap long lines</div>
                </div>
                <div className="settings-item-control">
                  <input
                    type="checkbox"
                    className="settings-checkbox"
                    checked={settings.editor.wordWrap}
                    onChange={(e) => handleEditorChange('wordWrap', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'shortcuts':
        return (
          <div className="settings-main">
            <div className="settings-section">
              <h3 className="settings-section-title">Keyboard Shortcuts</h3>
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
              
              <div className="settings-section">
                <h4 className="settings-group-title">Tips</h4>
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
          <div className="settings-sidebar">
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
              className={`settings-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              Shortcuts
            </button>
          </div>

          {renderTabContent()}
        </div>

        <div className="settings-footer">
          <button className="settings-button secondary" onClick={onResetSettings}>
            Reset to Defaults
          </button>
          <button className="settings-button primary" onClick={onClose}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
