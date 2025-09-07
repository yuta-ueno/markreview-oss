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
    theme: s.theme && ['github-light', 'github-dark', 'solarized-light', 'solarized-dark', 'nord', 'monokai', 'auto'].includes(s.theme) 
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
    },
    
    preview: {
      syncScroll: typeof s.preview?.syncScroll === 'boolean'
        ? s.preview.syncScroll
        : DEFAULT_SETTINGS.preview.syncScroll,
    },
    
    window: {
      width: typeof s.window?.width === 'number' && s.window.width >= 400 && s.window.width <= 3840
        ? s.window.width
        : DEFAULT_SETTINGS.window.width,
      height: typeof s.window?.height === 'number' && s.window.height >= 300 && s.window.height <= 2160
        ? s.window.height
        : DEFAULT_SETTINGS.window.height,
      x: typeof s.window?.x === 'number' ? s.window.x : s.window?.x,
      y: typeof s.window?.y === 'number' ? s.window.y : s.window?.y,
      maximized: typeof s.window?.maximized === 'boolean'
        ? s.window.maximized
        : DEFAULT_SETTINGS.window.maximized,
    },
    
    shortcuts: typeof s.shortcuts === 'object' && s.shortcuts !== null
      ? { ...DEFAULT_SETTINGS.shortcuts, ...s.shortcuts }
      : DEFAULT_SETTINGS.shortcuts,
  }

  return validatedSettings
}

// File-based settings with localStorage migration
const loadSettings = async (): Promise<AppSettings> => {
  try {
    // Try to load from file first (new method)
    const fileSettings = await loadSettingsFromFile()
    if (fileSettings) {
      console.log('Settings: Loaded from file')
      return fileSettings
    }
    
    // Fallback to localStorage and migrate (legacy method)
    console.log('Settings: File not found, checking localStorage')
    const localStorageSettings = loadSettingsFromLocalStorage()
    if (localStorageSettings && JSON.stringify(localStorageSettings) !== JSON.stringify(DEFAULT_SETTINGS)) {
      console.log('Settings: Found localStorage settings, migrating to file')
      await saveSettingsToFile(localStorageSettings)
      // Keep localStorage as backup for now
      return localStorageSettings
    }
    
    console.log('Settings: No existing settings found, using defaults')
    return DEFAULT_SETTINGS
  } catch (error) {
    console.error('Settings: Failed to load settings:', error)
    // Fallback to localStorage in case of file system issues
    return loadSettingsFromLocalStorage() || DEFAULT_SETTINGS
  }
}

// Load from file system (new method)
const loadSettingsFromFile = async (): Promise<AppSettings | null> => {
  try {
    const { appDataDir } = await import('@tauri-apps/api/path')
    const { exists, readTextFile } = await import('@tauri-apps/plugin-fs')
    
    const appDataPath = await appDataDir()
    const settingsPath = `${appDataPath}MarkReview/settings.json`
    
    if (await exists(settingsPath)) {
      const content = await readTextFile(settingsPath)
      const parsed = JSON.parse(content)
      return validateSettings(parsed)
    }
    
    return null
  } catch (error) {
    console.warn('Settings: Failed to load from file:', error)
    return null
  }
}

// Load from localStorage (legacy method)
const loadSettingsFromLocalStorage = (): AppSettings | null => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return validateSettings(parsed)
    }
  } catch (error) {
    console.warn('Settings: Failed to load from localStorage:', error)
  }
  return null
}

// Save to both file and localStorage (dual method for safety)
const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    // Save to file (primary method)
    await saveSettingsToFile(settings)
    
    // Keep localStorage as backup
    saveSettingsToLocalStorage(settings)
    
    console.log('Settings: Saved to both file and localStorage')
  } catch (error) {
    console.error('Settings: Failed to save to file, falling back to localStorage only:', error)
    saveSettingsToLocalStorage(settings)
  }
}

// Save to file system (new method)
const saveSettingsToFile = async (settings: AppSettings): Promise<void> => {
  try {
    const { appDataDir } = await import('@tauri-apps/api/path')
    const { exists, mkdir, writeTextFile } = await import('@tauri-apps/plugin-fs')
    
    const appDataPath = await appDataDir()
    const markReviewDir = `${appDataPath}MarkReview`
    const settingsPath = `${markReviewDir}/settings.json`
    
    // Ensure directory exists
    if (!(await exists(markReviewDir))) {
      await mkdir(markReviewDir, { recursive: true })
      console.log('Settings: Created MarkReview directory')
    }
    
    // Write settings file
    await writeTextFile(settingsPath, JSON.stringify(settings, null, 2))
    console.log('Settings: Saved to file:', settingsPath)
  } catch (error) {
    console.error('Settings: Failed to save to file:', error)
    throw error
  }
}

// Save to localStorage (legacy method)
const saveSettingsToLocalStorage = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Settings: Failed to save to localStorage:', error)
  }
}

export const useSettings = () => {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        console.log('Settings: Initializing settings')
        const loadedSettings = await loadSettings()
        setSettingsState(loadedSettings)
        console.log('Settings: Initialization complete')
      } catch (error) {
        console.error('Settings: Failed to initialize:', error)
        setSettingsState(DEFAULT_SETTINGS)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSettings()
  }, [])

  // Update settings with validation and persistence
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
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
        ...(newSettings.window && {
          window: { ...currentSettings.window, ...newSettings.window }
        }),
        ...(newSettings.shortcuts && {
          shortcuts: { ...currentSettings.shortcuts, ...newSettings.shortcuts }
        }),
      }
      
      const validatedSettings = validateSettings(mergedSettings)
      
      // Save settings asynchronously
      saveSettings(validatedSettings).catch(error => {
        console.error('Settings: Failed to save during update:', error)
      })
      
      return validatedSettings
    })
  }, [])

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    console.log('Settings: Resetting to defaults')
    const defaultSettings = validateSettings(DEFAULT_SETTINGS)
    setSettingsState(defaultSettings)
    await saveSettings(defaultSettings)
  }, [])

  // Export settings as JSON
  const exportSettings = useCallback((): string => {
    return JSON.stringify(settings, null, 2)
  }, [settings])

  // Import settings from JSON
  const importSettings = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      const imported = JSON.parse(jsonString)
      const validatedSettings = validateSettings(imported)
      setSettingsState(validatedSettings)
      await saveSettings(validatedSettings)
      return true
    } catch (error) {
      console.error('Settings: Failed to import settings:', error)
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
    isLoading,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  }
}