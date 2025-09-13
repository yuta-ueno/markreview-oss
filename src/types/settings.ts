export type ThemeMode = 'github-light' | 'github-dark' | 'solarized-light' | 'solarized-dark' | 'nord' | 'monokai' | 'auto'

export interface EditorSettings {
  fontSize: number
  fontFamily: string
  tabSize: number
  wordWrap: boolean
}

export interface PreviewSettings {
  syncScroll: boolean
}

export interface WindowSettings {
  width: number
  height: number
  x?: number
  y?: number
  maximized: boolean
}

export type ViewMode = 'split' | 'preview'

export interface AppSettings {
  theme: ThemeMode
  editor: EditorSettings
  preview: PreviewSettings
  window: WindowSettings
  shortcuts: Record<string, string>
  viewMode: ViewMode
  autoReload: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  // Pro専用テーマ化に伴い既定をOSSテーマへ変更
  theme: 'github-light',
  editor: {
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
    tabSize: 2,
    wordWrap: true,
  },
  preview: {
    syncScroll: true,
  },
  window: {
    width: 1200,
    height: 800,
    maximized: false,
  },
  shortcuts: {
    'new': 'Ctrl+N',
    'open': 'Ctrl+O',
    'save': 'Ctrl+S',
    'find': 'Ctrl+F',
    'settings': 'Ctrl+,',
  },
  // Change default: Edit Off (Preview-only)
  viewMode: 'preview',
  autoReload: false,
}

export type SettingsKey = keyof AppSettings
export type EditorSettingsKey = keyof EditorSettings
export type PreviewSettingsKey = keyof PreviewSettings
export type WindowSettingsKey = keyof WindowSettings
