import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../types/settings'
import App from '../App'

// Mock hooks that hit filesystem or Tauri
vi.mock('../hooks/useTauriIntegration', () => ({
  useTauriIntegration: () => ({ isTauri: false, readTextFile: async () => '' })
}))

vi.mock('../hooks/useFileOperations', () => ({
  DEFAULT_CONTENT: '# Title',
  useFileOperations: () => ({
    handleNew: vi.fn(),
    handleOpen: vi.fn(),
    handleSave: vi.fn(),
    handleFileRead: vi.fn(),
    handleTauriFileDrop: vi.fn(),
    triggerFileOpen: vi.fn(),
  })
}))

// Force settings to a given viewMode
vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { ...DEFAULT_SETTINGS, viewMode: 'split' as const },
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    isLoading: false,
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
  })
}))

describe('App layout by view mode', () => {
  test('split mode renders SplitPane', () => {
    render(<App />)
    expect(screen.getByTestId('split-pane-left')).toBeInTheDocument()
    expect(screen.getByTestId('split-pane-right')).toBeInTheDocument()
  })
})
