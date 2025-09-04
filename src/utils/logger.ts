// Logger utility for environment-based logging control
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    console.error(...args) // Always show errors
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(...args)
    }
  }
}

// Theme-specific logging helpers
export const themeLogger = {
  themeChange: (from: string, to: string) => {
    logger.log(`Theme change from ${from} to ${to}`)
  },
  
  themeApplied: (theme: string, attribute?: string) => {
    logger.log(`Applied theme: ${theme}${attribute ? `, data-theme attribute set to: ${attribute}` : ''}`)
  },

  autoThemeDetected: (theme: string) => {
    logger.log(`Auto theme detected: ${theme}`)
  },

  systemThemeChanged: (theme: string) => {
    logger.log(`System theme changed to: ${theme}`)
  },

  editorThemeUpdate: (theme: string) => {
    logger.log(`Editor theme update: ${theme}`)
  },

  directThemeSet: (theme: string) => {
    logger.log(`Direct theme set: ${theme}`)
  }
}

// Tauri-specific logging helpers
export const tauriLogger = {
  environmentCheck: (details: any) => {
    logger.log('Checking Tauri environment:', details)
  },

  environmentDetected: (delayed = false) => {
    logger.log(`Running in Tauri environment${delayed ? ' (delayed detection)' : ''}`)
  },

  environmentNotDetected: () => {
    logger.log('Final check: Not running in Tauri environment')
  },

  retryDetection: () => {
    logger.log('Tauri not detected immediately, retrying in 100ms...')
  },

  apiImportAttempt: () => {
    logger.log('Attempting to import Tauri fs API...')
  },

  apiImportSuccess: () => {
    logger.log('Successfully imported Tauri fs API')
  },

  fileDropSetup: () => {
    logger.log('Setting up Tauri file drop listener...')
  },

  fileDropComplete: () => {
    logger.log('Tauri file drop listener setup complete')
  },

  fileDropReceived: (event: any) => {
    logger.log('File drop event received:', event)
  },

  processingDroppedFile: (filePath: string) => {
    logger.log('Processing dropped file:', filePath)
  }
}

// CodeMirror-specific logging helpers  
export const editorLogger = {
  themeChange: (from: string, to: string) => {
    logger.log(`CodeMirror theme change from ${from} to ${to}`)
  },

  themeApplying: (theme: string) => {
    logger.log(`Applying CodeMirror theme: ${theme}`)
  },

  editorThemeUpdate: (theme: string) => {
    logger.log(`Editor theme update: ${theme}`)
  },

  directThemeSet: (theme: string) => {
    logger.log(`Direct theme set: ${theme}`)
  }
}