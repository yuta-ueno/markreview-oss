import React, { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { solarizedLight, solarizedDark } from '@uiw/codemirror-theme-solarized'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'
import { nord } from '@uiw/codemirror-theme-nord'
import { monokai } from '@uiw/codemirror-theme-monokai'
import { lineNumbers as showLineNumbers } from '@codemirror/view'
import { indentUnit } from '@codemirror/language'
import { editorLogger } from '../utils/logger'
import { ThemeMode } from '../types/settings'
import './CodeMirrorEditor.css'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  theme?: ThemeMode
  // Editor settings
  fontSize?: number
  fontFamily?: string
  tabSize?: number
  wordWrap?: boolean
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing your markdown...',
  theme = 'github-light',
  // Editor settings with defaults
  fontSize = 14,
  fontFamily = 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
  tabSize = 2,
  wordWrap = true,
}) => {
  const editor = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const currentTheme = useRef<string>(theme)
  const isProgrammaticUpdate = useRef<boolean>(false)

  useEffect(() => {
    if (!editor.current) return

    // Check if theme actually changed
    if (currentTheme.current === theme && viewRef.current) {
      return
    }

    editorLogger.themeChange(currentTheme.current, theme)
    currentTheme.current = theme

    // Clean up existing editor
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    const handleChange = (newValue: string) => {
      onChange(newValue)
    }

    const extensions = [
      basicSetup,
      markdown(),
      EditorState.changeFilter.of(() => true),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isProgrammaticUpdate.current) {
          // Only trigger onChange for user-initiated changes
          const newValue = update.state.doc.toString()
          handleChange(newValue)
        }
      }),
      // Tab size configuration
      indentUnit.of(' '.repeat(tabSize)),
      EditorView.theme({
        '&': {
          height: '100%',
        },
        '.cm-scroller': {
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`,
          lineHeight: '1.5',
          ...(wordWrap ? {} : { whiteSpace: 'nowrap', overflowX: 'auto' }),
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-editor': {
          height: '100%',
        },
        '.cm-content': {
          padding: '16px',
          minHeight: '100%',
        },
      }),
    ]

    // Apply line numbers (always enabled)
    extensions.push(showLineNumbers())

    // Apply word wrap setting
    if (wordWrap) {
      extensions.push(EditorView.lineWrapping)
    }

    // Apply theme
    editorLogger.themeApplying(theme)
    
    // Map theme to CodeMirror theme
    const getCodeMirrorTheme = (themeMode: ThemeMode) => {
      // Check system preference for auto theme
      if (themeMode === 'auto') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        return isDarkMode ? githubDark : githubLight
      }
      
      switch (themeMode) {
        case 'github-light':
          return githubLight
        case 'github-dark':
          return githubDark
        case 'solarized-light':
          return solarizedLight
        case 'solarized-dark':
          return solarizedDark
        case 'nord':
          return nord
        case 'monokai':
          return monokai
        default:
          return githubLight // fallback
      }
    }
    
    extensions.push(getCodeMirrorTheme(theme))

    if (placeholder) {
      extensions.push(
        EditorView.theme({
          '.cm-content': {
            '&[data-placeholder]::before': {
              content: `"${placeholder}"`,
              color: '#999',
              fontStyle: 'italic',
              position: 'absolute',
              pointerEvents: 'none',
            },
          },
        })
      )
    }

    // Set flag to prevent onChange trigger during editor initialization
    isProgrammaticUpdate.current = true
    
    const state = EditorState.create({
      doc: value,
      extensions,
    })

    viewRef.current = new EditorView({
      state,
      parent: editor.current,
    })
    
    // Reset flag after initialization
    setTimeout(() => {
      isProgrammaticUpdate.current = false
    }, 50)

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, placeholder, fontSize, fontFamily, tabSize, wordWrap]) // Add editor settings to dependencies

  // Update editor content when value changes externally
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      // Set flag to prevent onChange trigger during programmatic update
      isProgrammaticUpdate.current = true
      
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      })
      
      // Reset flag after a short delay to allow the update to complete
      setTimeout(() => {
        isProgrammaticUpdate.current = false
      }, 10)
    }
  }, [value])

  return <div ref={editor} className="codemirror-editor" />
}

export default CodeMirrorEditor