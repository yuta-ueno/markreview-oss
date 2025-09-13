// Application configuration constants
// Centralized place for all hardcoded values to improve maintainability

export const APP_CONFIG = {
  // Performance settings
  DEBOUNCE_DELAY: 200, // ms - Delay for markdown preview updates
  THROTTLE_DELAY: 100, // ms - Delay for scroll sync operations
  
  // File handling settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB - Maximum file size for uploads
  SUPPORTED_FILE_EXTENSIONS: ['.md', '.markdown', '.txt'],
  SUPPORTED_FILE_PATTERN: /\.(md|markdown|txt)$/i,
  
  // Editor settings
  EDITOR_FONT_FAMILY: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
  EDITOR_FONT_SIZE: '14px',
  EDITOR_LINE_HEIGHT: '1.5',
  EDITOR_PADDING: '16px',
  
  // Tauri settings
  TAURI_RETRY_DELAY: 100, // ms - Delay before retrying Tauri detection
  TAURI_FILE_DROP_EVENT: 'tauri://drag-drop', // Tauri 2.0 updated event name
  TAURI_DRAG_ENTER_EVENT: 'tauri://drag-enter',
  TAURI_DRAG_LEAVE_EVENT: 'tauri://drag-leave',
  TAURI_FILE_ARGS_EVENT: 'tauri://file-args',
  
  // Split pane settings
  DEFAULT_SPLIT_RATIO: 50, // % - Default left/right pane ratio
  MIN_PANE_SIZE: 25, // % - Minimum size for each pane
  
  // Theme settings (Core build)
  AVAILABLE_THEMES: ['github-light', 'github-dark', 'auto'] as const,
  DEFAULT_THEME: 'github-light' as const,
  
  // Toast/notification settings
  TOAST_AUTO_CLOSE_DELAY: 4000, // ms - Auto-close delay for toast messages
  TOAST_ANIMATION_DELAY: {
    SHOW: 100, // ms - Show animation delay
    HIDE: 300, // ms - Hide animation delay
  },
  
  // Default keyboard shortcuts
  DEFAULT_SHORTCUTS: {
    new: 'Ctrl+N',
    open: 'Ctrl+O',
    save: 'Ctrl+S',
    find: 'Ctrl+F',
    settings: 'Ctrl+,',
  },
  
  // Placeholder text
  PLACEHOLDERS: {
    EDITOR: 'Start typing your markdown...',
    FILE_OPEN: 'Click Record to set shortcut',
    MARKDOWN_INPUT: 'Start typing your markdown...',
  },
  
  // File validation messages
  VALIDATION_MESSAGES: {
    INVALID_FILE_TYPE: 'Please select a Markdown file (.md, .markdown, or .txt)',
    FILE_TOO_LARGE: 'File is too large (maximum 10MB)',
    FILE_READ_ERROR: 'Error reading file',
    TAURI_API_UNAVAILABLE: 'Tauri file API not available',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    FILE_OPENED: (filename: string) => `File "${filename}" opened successfully`,
    FILE_SAVED: (filename: string) => `File "${filename}" saved successfully`,
  },
  
  // Default filenames
  DEFAULT_FILENAME: 'Untitled.md',
  FALLBACK_FILENAME: 'document.md',
  UNKNOWN_FILENAME: 'Unknown.md',
  
  // Browser download settings
  DOWNLOAD_MIME_TYPE: 'text/markdown;charset=utf-8',
  
  // Application info
  APP_NAME: 'MarkReview',
  APP_DESCRIPTION: 'Lightweight Markdown viewer and editor',
  ENVIRONMENT_LABELS: {
    TAURI: 'Desktop App',
    BROWSER: 'Web Browser',
  },
} as const

// Type definitions for configuration
export type AppTheme = typeof APP_CONFIG.AVAILABLE_THEMES[number]
export type ShortcutAction = keyof typeof APP_CONFIG.DEFAULT_SHORTCUTS

// Utility functions for configuration
export const isValidTheme = (theme: string): theme is AppTheme => {
  return APP_CONFIG.AVAILABLE_THEMES.includes(theme as AppTheme)
}

export const isValidFileExtension = (filename: string): boolean => {
  return APP_CONFIG.SUPPORTED_FILE_PATTERN.test(filename)
}

export const isValidFileSize = (size: number): boolean => {
  return size <= APP_CONFIG.MAX_FILE_SIZE
}

export const getFileExtensionFromPath = (filePath: string): string => {
  return filePath.split(/[/\\]/).pop() || APP_CONFIG.UNKNOWN_FILENAME
}

// CSS custom properties mapping for themes
export const CSS_VARIABLES = {
  SOLARIZED_LIGHT: {
    '--bg-primary': '#fdf6e3',
    '--bg-secondary': '#eee8d5',
    '--text-primary': '#657b83',
    '--text-muted': '#93a1a1',
    '--border-color': '#d3c7b8',
    '--accent-color': '#268bd2',
  },
  SOLARIZED_DARK: {
    '--bg-primary': '#002b36',
    '--bg-secondary': '#073642',
    '--text-primary': '#839496',
    '--text-muted': '#586e75',
    '--border-color': '#264750',
    '--accent-color': '#268bd2',
  },
} as const
