import { useEffect, useState, forwardRef } from 'react'
import CodeMirrorEditor from './CodeMirrorEditor'
import './Editor.css'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const Editor = forwardRef<HTMLDivElement, EditorProps>(({
  value,
  onChange,
  placeholder = 'Start typing your markdown...',
}, ref) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    // Detect system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkTheme(mediaQuery.matches)

    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches)
    }

    mediaQuery.addEventListener('change', handleThemeChange)
    return () => mediaQuery.removeEventListener('change', handleThemeChange)
  }, [])

  return (
    <div className="editor" ref={ref}>
      <div className="editor-header">
        <h3>Editor</h3>
      </div>
      <div className="editor-content">
        <CodeMirrorEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          darkTheme={isDarkTheme}
        />
      </div>
    </div>
  )
})

Editor.displayName = 'Editor'

export default Editor