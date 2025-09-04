import { useEffect, useState, forwardRef } from 'react'
import CodeMirrorEditor from './CodeMirrorEditor'
import { AppSettings } from '../types/settings'
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
  const [editorTheme, setEditorTheme] = useState<'solarized-light' | 'solarized-dark'>('solarized-light')

  useEffect(() => {
    const updateTheme = () => {
      console.log('Editor theme update:', settings.theme)
      if (settings.theme === 'auto') {
        // Use system preference for auto theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const newTheme = mediaQuery.matches ? 'solarized-dark' : 'solarized-light'
        console.log('Auto theme detected:', newTheme)
        setEditorTheme(newTheme)
      } else {
        // Use selected theme directly
        const newTheme = settings.theme as 'solarized-light' | 'solarized-dark'
        console.log('Direct theme set:', newTheme)
        setEditorTheme(newTheme)
      }
    }

    updateTheme()

    // Listen for system theme changes only if theme is set to auto
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleThemeChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'solarized-dark' : 'solarized-light'
        console.log('System theme changed to:', newTheme)
        setEditorTheme(newTheme)
      }
      
      mediaQuery.addEventListener('change', handleThemeChange)
      return () => mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [settings.theme])

  return (
    <div className="editor" ref={ref}>
      <div className="editor-header">
        <h3>Editor</h3>
      </div>
      <div className="editor-content">
        <CodeMirrorEditor
          key={editorTheme} 
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          theme={editorTheme}
        />
      </div>
    </div>
  )
})

Editor.displayName = 'Editor'

export default Editor