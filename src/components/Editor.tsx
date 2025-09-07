import { useEffect, forwardRef } from 'react'
import CodeMirrorEditor from './CodeMirrorEditor'
import { AppSettings } from '../types/settings'
import { themeLogger } from '../utils/logger'
import './Editor.css'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  settings: AppSettings
}

const Editor = forwardRef<HTMLDivElement, EditorProps>(({
  value,
  onChange,
  placeholder = 'Start typing your markdown...',
  settings,
}, ref) => {
  useEffect(() => {
    themeLogger.editorThemeUpdate(settings.theme)
  }, [settings.theme])

  return (
    <div className="editor" ref={ref}>
      <div className="editor-header">
        <h3>Editor</h3>
      </div>
      <div className="editor-content">
        <CodeMirrorEditor
          key={settings.theme} 
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          theme={settings.theme}
          fontSize={settings.editor.fontSize}
          fontFamily={settings.editor.fontFamily}
          tabSize={settings.editor.tabSize}
          wordWrap={settings.editor.wordWrap}
        />
      </div>
    </div>
  )
})

Editor.displayName = 'Editor'

export default Editor