import { AppSettings, DEFAULT_SETTINGS } from '../types/settings'
import { logger } from './logger'

const SETTINGS_STORAGE_KEY = 'markreview-settings'

// Validation: merge partial objects with defaults and coerce invalid values
export const validateSettings = (settings: unknown): AppSettings => {
  if (!settings || typeof settings !== 'object') return DEFAULT_SETTINGS
  const s = settings as Partial<AppSettings>

  const validated: AppSettings = {
    theme:
      s.theme && ['github-light', 'github-dark', 'solarized-light', 'solarized-dark', 'nord', 'monokai', 'auto'].includes(s.theme)
        ? s.theme
        : DEFAULT_SETTINGS.theme,
    viewMode:
      s && typeof (s as any).viewMode === 'string' && ['split', 'preview'].includes((s as any).viewMode as string)
        ? ((s as any).viewMode as AppSettings['viewMode'])
        : DEFAULT_SETTINGS.viewMode,
    editor: {
      fontSize: typeof s.editor?.fontSize === 'number' && s.editor.fontSize >= 8 && s.editor.fontSize <= 32 ? s.editor.fontSize : DEFAULT_SETTINGS.editor.fontSize,
      fontFamily: typeof s.editor?.fontFamily === 'string' && s.editor.fontFamily.trim() ? s.editor.fontFamily : DEFAULT_SETTINGS.editor.fontFamily,
      tabSize: typeof s.editor?.tabSize === 'number' && s.editor.tabSize >= 1 && s.editor.tabSize <= 8 ? s.editor.tabSize : DEFAULT_SETTINGS.editor.tabSize,
      wordWrap: typeof s.editor?.wordWrap === 'boolean' ? s.editor.wordWrap : DEFAULT_SETTINGS.editor.wordWrap,
    },
    preview: {
      syncScroll: typeof s.preview?.syncScroll === 'boolean' ? s.preview.syncScroll : DEFAULT_SETTINGS.preview.syncScroll,
    },
    window: {
      width: typeof s.window?.width === 'number' && s.window.width >= 400 && s.window.width <= 3840 ? s.window.width : DEFAULT_SETTINGS.window.width,
      height: typeof s.window?.height === 'number' && s.window.height >= 300 && s.window.height <= 2160 ? s.window.height : DEFAULT_SETTINGS.window.height,
      x: typeof s.window?.x === 'number' ? s.window.x : s.window?.x,
      y: typeof s.window?.y === 'number' ? s.window.y : s.window?.y,
      maximized: typeof s.window?.maximized === 'boolean' ? s.window.maximized : DEFAULT_SETTINGS.window.maximized,
    },
    shortcuts: typeof s.shortcuts === 'object' && s.shortcuts !== null ? { ...DEFAULT_SETTINGS.shortcuts, ...s.shortcuts } : DEFAULT_SETTINGS.shortcuts,
  }
  return validated
}

// File-based settings (primary)
const loadFromFile = async (): Promise<AppSettings | null> => {
  try {
    const { appDataDir } = await import('@tauri-apps/api/path')
    const { exists, readTextFile } = await import('@tauri-apps/plugin-fs')
    const appDataPath = await appDataDir()
    const settingsPath = `${appDataPath}MarkReview/settings.json`
    if (await exists(settingsPath)) {
      const content = await readTextFile(settingsPath)
      return validateSettings(JSON.parse(content))
    }
    return null
  } catch (error) {
    logger.warn('Settings: Failed to load from file:', error)
    return null
  }
}

const saveToFile = async (settings: AppSettings): Promise<void> => {
  try {
    const { appDataDir } = await import('@tauri-apps/api/path')
    const { exists, mkdir, writeTextFile } = await import('@tauri-apps/plugin-fs')
    const appDataPath = await appDataDir()
    const dir = `${appDataPath}MarkReview`
    const path = `${dir}/settings.json`
    if (!(await exists(dir))) {
      await mkdir(dir, { recursive: true })
      logger.debug('Settings: Created MarkReview directory')
    }
    await writeTextFile(path, JSON.stringify(settings, null, 2))
    logger.debug('Settings: Saved to file:', path)
  } catch (error) {
    logger.error('Settings: Failed to save to file:', error)
    throw error
  }
}

// LocalStorage (fallback/backup)
const loadFromLocalStorage = (): AppSettings | null => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) return validateSettings(JSON.parse(stored))
  } catch (error) {
    logger.warn('Settings: Failed to load from localStorage:', error)
  }
  return null
}

const saveToLocalStorage = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    logger.error('Settings: Failed to save to localStorage:', error)
  }
}

// Public adapter API
export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const fileSettings = await loadFromFile()
    if (fileSettings) {
      logger.debug('Settings: Loaded from file')
      return fileSettings
    }
    logger.debug('Settings: File not found, checking localStorage')
    const ls = loadFromLocalStorage()
    if (ls && JSON.stringify(ls) !== JSON.stringify(DEFAULT_SETTINGS)) {
      logger.debug('Settings: Found localStorage settings, migrating to file')
      try { await saveToFile(ls) } catch { /* ignore, still return ls */ }
      return ls
    }
    logger.debug('Settings: No existing settings found, using defaults')
    return DEFAULT_SETTINGS
  } catch (error) {
    logger.error('Settings: Failed to load settings:', error)
    return loadFromLocalStorage() || DEFAULT_SETTINGS
  }
}

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await saveToFile(settings)
    saveToLocalStorage(settings)
    logger.debug('Settings: Saved to both file and localStorage')
  } catch (error) {
    // fallback to localStorage only
    logger.error('Settings: Failed to save to file, falling back to localStorage only:', error)
    saveToLocalStorage(settings)
  }
}
