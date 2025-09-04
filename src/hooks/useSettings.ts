import { useState, useCallback, useEffect } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings'

const SETTINGS_STORAGE_KEY = 'markreview-settings'

// Validation functions
const validateSettings = (settings: unknown): AppSettings => {
  if (!settings || typeof settings !== 'object') {
    return DEFAULT_SETTINGS
  }

  const s = settings as Partial<AppSettings>

  // Merge with defaults to handle missing properties
  const validatedSettings: AppSettings = {
    theme: s.theme && ['solarized-light', 'solarized-dark', 'auto'].includes(s.theme) 
      ? s.theme 
      : DEFAULT_SETTINGS.theme,
    
    editor: {
      fontSize: typeof s.editor?.fontSize === 'number' && s.editor.fontSize >= 8 && s.editor.fontSize <= 32
        ? s.editor.fontSize
        : DEFAULT_SETTINGS.editor.fontSize,
      
      fontFamily: typeof s.editor?.fontFamily === 'string' && s.editor.fontFamily.trim()
        ? s.editor.fontFamily
        : DEFAULT_SETTINGS.editor.fontFamily,
        
      tabSize: typeof s.editor?.tabSize === 'number' && s.editor.tabSize >= 1 && s.editor.tabSize <= 8
        ? s.editor.tabSize
        : DEFAULT_SETTINGS.editor.tabSize,
        
      wordWrap: typeof s.editor?.wordWrap === 'boolean'
        ? s.editor.wordWrap
        : DEFAULT_SETTINGS.editor.wordWrap,
        
      lineNumbers: typeof s.editor?.lineNumbers === 'boolean'
        ? s.editor.lineNumbers
        : DEFAULT_SETTINGS.editor.lineNumbers,
        
      minimap: typeof s.editor?.minimap === 'boolean'
        ? s.editor.minimap
        : DEFAULT_SETTINGS.editor.minimap,
    },
    
    preview: {
      maxWidth: (typeof s.preview?.maxWidth === 'number' && s.preview.maxWidth > 0) || s.preview?.maxWidth === 'full'
        ? s.preview.maxWidth
        : DEFAULT_SETTINGS.preview.maxWidth,
        
      syncScroll: typeof s.preview?.syncScroll === 'boolean'
        ? s.preview.syncScroll
        : DEFAULT_SETTINGS.preview.syncScroll,
        
      showLineNumbers: typeof s.preview?.showLineNumbers === 'boolean'
        ? s.preview.showLineNumbers
        : DEFAULT_SETTINGS.preview.showLineNumbers,
        
      highlightCurrentLine: typeof s.preview?.highlightCurrentLine === 'boolean'
        ? s.preview.highlightCurrentLine
        : DEFAULT_SETTINGS.preview.highlightCurrentLine,
    },
    
    export: {
      includeCSS: typeof s.export?.includeCSS === 'boolean'
        ? s.export.includeCSS
        : DEFAULT_SETTINGS.export.includeCSS,
        
      includeTitle: typeof s.export?.includeTitle === 'boolean'
        ? s.export.includeTitle
        : DEFAULT_SETTINGS.export.includeTitle,
        
      exportFormat: s.export?.exportFormat && ['html', 'pdf'].includes(s.export.exportFormat)
        ? s.export.exportFormat
        : DEFAULT_SETTINGS.export.exportFormat,
    },
    
    shortcuts: typeof s.shortcuts === 'object' && s.shortcuts !== null
      ? { ...DEFAULT_SETTINGS.shortcuts, ...s.shortcuts }
      : DEFAULT_SETTINGS.shortcuts,
  }

  return validatedSettings
}

// Load settings from localStorage
const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return validateSettings(parsed)
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error)
  }
  
  return DEFAULT_SETTINGS
}

// Save settings to localStorage
const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error)
  }
}

export const useSettings = () => {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)

  // Update settings with validation and persistence
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettingsState(currentSettings => {
      const mergedSettings = {
        ...currentSettings,
        ...newSettings,
        // Handle nested objects properly
        ...(newSettings.editor && {
          editor: { ...currentSettings.editor, ...newSettings.editor }
        }),
        ...(newSettings.preview && {
          preview: { ...currentSettings.preview, ...newSettings.preview }
        }),
        ...(newSettings.export && {
          export: { ...currentSettings.export, ...newSettings.export }
        }),
        ...(newSettings.shortcuts && {
          shortcuts: { ...currentSettings.shortcuts, ...newSettings.shortcuts }
        }),
      }
      
      const validatedSettings = validateSettings(mergedSettings)
      saveSettings(validatedSettings)
      return validatedSettings
    })
  }, [])

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    const defaultSettings = validateSettings(DEFAULT_SETTINGS)
    setSettingsState(defaultSettings)
    saveSettings(defaultSettings)
  }, [])

  // Export settings as JSON
  const exportSettings = useCallback((): string => {
    return JSON.stringify(settings, null, 2)
  }, [settings])

  // Import settings from JSON
  const importSettings = useCallback((jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString)
      const validatedSettings = validateSettings(imported)
      setSettingsState(validatedSettings)
      saveSettings(validatedSettings)
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }, [])

  // Effect to handle system theme changes when theme is set to 'auto'
  useEffect(() => {
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleThemeChange = () => {
        // Trigger re-render by updating a non-persisted state
        // The actual theme detection will happen in components
      }

      mediaQuery.addEventListener('change', handleThemeChange)
      return () => mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [settings.theme])

  return {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  }
}