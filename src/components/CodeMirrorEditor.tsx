import React, { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { solarizedLight, solarizedDark } from '@uiw/codemirror-theme-solarized'
import { editorLogger } from '../utils/logger'
import './CodeMirrorEditor.css'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  theme?: 'solarized-light' | 'solarized-dark'
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing your markdown...',
  theme = 'solarized-light',
}) => {
  const editor = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const currentTheme = useRef<string>(theme)

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
        if (update.docChanged) {
          const newValue = update.state.doc.toString()
          handleChange(newValue)
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
        },
        '.cm-scroller': {
          fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
          fontSize: '14px',
          lineHeight: '1.5',
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

    // Apply Solarized theme
    editorLogger.themeApplying(theme)
    if (theme === 'solarized-dark') {
      extensions.push(solarizedDark)
    } else {
      extensions.push(solarizedLight)
    }

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

    const state = EditorState.create({
      doc: value,
      extensions,
    })

    viewRef.current = new EditorView({
      state,
      parent: editor.current,
    })

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, placeholder]) // Recreate editor when theme changes

  // Update editor content when value changes externally
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      })
    }
  }, [value])

  return <div ref={editor} className="codemirror-editor" />
}

export default CodeMirrorEditor