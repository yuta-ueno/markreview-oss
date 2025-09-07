import { useState, useCallback, useEffect } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings'
import { logger } from '../utils/logger'
import { loadSettings as persistLoadSettings, saveSettings as persistSaveSettings, validateSettings } from '../utils/settingsPersist'

export const useSettings = () => {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const saveTimerRef = { current: 0 as number | undefined }

  useEffect(() => {
    const init = async () => {
      try {
        logger.debug('Settings: Initializing settings')
        const loaded = await persistLoadSettings()
        setSettingsState(loaded)
        logger.debug('Settings: Initialization complete')
      } catch (e) {
        logger.error('Settings: Failed to initialize:', e)
        setSettingsState(DEFAULT_SETTINGS)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettingsState(current => {
      const merged = {
        ...current,
        ...newSettings,
        ...(newSettings.editor && { editor: { ...current.editor, ...newSettings.editor } }),
        ...(newSettings.preview && { preview: { ...current.preview, ...newSettings.preview } }),
        ...(newSettings.window && { window: { ...current.window, ...newSettings.window } }),
        ...(newSettings.shortcuts && { shortcuts: { ...current.shortcuts, ...newSettings.shortcuts } }),
      }
      const validated = validateSettings(merged)
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(() => {
        persistSaveSettings(validated).catch(err => logger.error('Settings: Failed to save during update:', err))
      }, 500)
      return validated
    })
  }, [])

  const resetSettings = useCallback(async () => {
    logger.debug('Settings: Resetting to defaults')
    const defaults = validateSettings(DEFAULT_SETTINGS)
    setSettingsState(defaults)
    await persistSaveSettings(defaults)
  }, [])

  const exportSettings = useCallback(() => JSON.stringify(settings, null, 2), [settings])

  const importSettings = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      const imported = JSON.parse(jsonString)
      const validated = validateSettings(imported)
      setSettingsState(validated)
      await persistSaveSettings(validated)
      return true
    } catch (error) {
      logger.error('Settings: Failed to import settings:', error)
      return false
    }
  }, [])

  useEffect(() => {
    if (settings.theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => {}
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
  }, [settings.theme])

  return { settings, isLoading, updateSettings, resetSettings, exportSettings, importSettings }
}

