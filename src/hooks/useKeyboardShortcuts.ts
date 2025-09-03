import { useEffect, useCallback } from 'react'
import { AppSettings } from '../types/settings'

export interface KeyboardShortcutHandlers {
  onNew?: () => void
  onOpen?: () => void
  onSave?: () => void
  onFind?: () => void
  onTogglePreview?: () => void
  onToggleSettings?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers, settings?: AppSettings) => {
  const {
    onNew,
    onOpen,
    onSave,
    onFind,
    onTogglePreview,
    onToggleSettings,
    onZoomIn,
    onZoomOut,
    onZoomReset,
  } = handlers

  const parseShortcut = useCallback((shortcut: string) => {
    const parts = shortcut.split('+').map(part => part.trim())
    const modifiers = {
      ctrl: parts.includes('Ctrl'),
      alt: parts.includes('Alt'),
      shift: parts.includes('Shift'),
      meta: parts.includes('Cmd')
    }
    const key = parts.find(part => !['Ctrl', 'Alt', 'Shift', 'Cmd'].includes(part))
    return { modifiers, key }
  }, [])

  const matchesShortcut = useCallback((event: KeyboardEvent, shortcut: string) => {
    const { modifiers, key } = parseShortcut(shortcut)
    
    const eventModifiers = {
      ctrl: event.ctrlKey,
      alt: event.altKey, 
      shift: event.shiftKey,
      meta: event.metaKey
    }

    // Check if modifiers match
    const modifiersMatch = Object.keys(modifiers).every(
      mod => modifiers[mod as keyof typeof modifiers] === eventModifiers[mod as keyof typeof eventModifiers]
    )

    if (!modifiersMatch) return false

    // Map key names to event key values
    const keyMap: Record<string, string[]> = {
      'N': ['KeyN', 'n', 'N'],
      'O': ['KeyO', 'o', 'O'], 
      'S': ['KeyS', 's', 'S'],
      'F': ['KeyF', 'f', 'F'],
      ',': ['Comma', ','],
      'Space': [' ', 'Space'],
      'Enter': ['Enter'],
      'Escape': ['Escape']
    }

    const possibleKeys = keyMap[key || ''] || [key]
    return possibleKeys.includes(event.code) || possibleKeys.includes(event.key)
  }, [parseShortcut])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if user is typing in an input field
    const target = event.target as HTMLElement
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true' ||
                        target.classList.contains('cm-content')

    // For editor-specific shortcuts, allow them even when focused in CodeMirror
    const isEditorShortcut = (event.ctrlKey || event.metaKey) && 
                            ['KeyF'].includes(event.code)

    // For global shortcuts, prevent them when typing unless they're editor shortcuts
    if (isInputField && !isEditorShortcut) {
      return
    }

    // Use custom shortcuts if settings provided, otherwise fall back to defaults
    const shortcuts = settings?.shortcuts || {
      'new': 'Ctrl+N',
      'open': 'Ctrl+O', 
      'save': 'Ctrl+S',
      'find': 'Ctrl+F',
      'settings': 'Ctrl+,'
    }

    // Check custom shortcuts
    for (const [action, shortcut] of Object.entries(shortcuts)) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault()
        
        switch (action) {
          case 'new':
            onNew?.()
            break
          case 'open':
            onOpen?.()
            break
          case 'save':
            onSave?.()
            break
          case 'find':
            // Let CodeMirror handle Ctrl+F in the editor
            if (!target.classList.contains('cm-content')) {
              onFind?.()
            }
            break
          case 'settings':
            onToggleSettings?.()
            break
        }
        return
      }
    }

    // Keep existing hardcoded shortcuts for features not yet configurable
    const isCtrlOrCmd = event.ctrlKey || event.metaKey
    if (isCtrlOrCmd) {
      switch (event.code) {
        case 'KeyP':
          if (event.shiftKey) {
            event.preventDefault()
            onTogglePreview?.()
          }
          break

        case 'Equal':
        case 'NumpadAdd':
          if (event.shiftKey || event.code === 'NumpadAdd') {
            event.preventDefault()
            onZoomIn?.()
          }
          break

        case 'Minus':
        case 'NumpadSubtract':
          event.preventDefault()
          onZoomOut?.()
          break

        case 'Digit0':
        case 'Numpad0':
          event.preventDefault()
          onZoomReset?.()
          break
      }
    }

    // Special shortcuts without modifiers
    switch (event.code) {
      case 'F11':
        // Let browser handle fullscreen, but could add custom logic here
        break
        
      case 'Escape':
        // Could be used to close modals, clear search, etc.
        break
    }
  }, [onNew, onOpen, onSave, onFind, onTogglePreview, onToggleSettings, onZoomIn, onZoomOut, onZoomReset, settings, matchesShortcut])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Return current shortcuts for UI display
  const currentShortcuts = settings?.shortcuts || {
    'new': 'Ctrl+N',
    'open': 'Ctrl+O', 
    'save': 'Ctrl+S',
    'find': 'Ctrl+F',
    'settings': 'Ctrl+,'
  }

  return { shortcuts: currentShortcuts }
}