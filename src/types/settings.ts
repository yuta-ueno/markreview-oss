export type ThemeMode = 'light' | 'dark' | 'auto'

export interface EditorSettings {
  fontSize: number
  fontFamily: string
  tabSize: number
  wordWrap: boolean
  lineNumbers: boolean
  minimap: boolean
}

export interface PreviewSettings {
  maxWidth: number | 'full'
  syncScroll: boolean
  showLineNumbers: boolean
  highlightCurrentLine: boolean
}

export interface ExportSettings {
  includeCSS: boolean
  includeTitle: boolean
  exportFormat: 'html' | 'pdf'
}

export interface AppSettings {
  theme: ThemeMode
  editor: EditorSettings
  preview: PreviewSettings
  export: ExportSettings
  shortcuts: Record<string, string>
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  editor: {
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
  },
  preview: {
    maxWidth: 'full',
    syncScroll: true,
    showLineNumbers: false,
    highlightCurrentLine: false,
  },
  export: {
    includeCSS: true,
    includeTitle: true,
    exportFormat: 'html',
  },
  shortcuts: {
    'new': 'Ctrl+N',
    'open': 'Ctrl+O',
    'save': 'Ctrl+S',
    'find': 'Ctrl+F',
    'settings': 'Ctrl+,',
  },
}

export type SettingsKey = keyof AppSettings
export type EditorSettingsKey = keyof EditorSettings
export type PreviewSettingsKey = keyof PreviewSettings
export type ExportSettingsKey = keyof ExportSettings