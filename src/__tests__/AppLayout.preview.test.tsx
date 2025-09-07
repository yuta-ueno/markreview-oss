import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../types/settings'

// Mock hooks before importing App
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

vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { ...DEFAULT_SETTINGS, viewMode: 'preview' as const },
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    isLoading: false,
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
  })
}))

import App from '../App'

describe('App layout preview-only mode', () => {
  test('renders only Preview when viewMode is preview', () => {
    render(<App />)
    expect(screen.queryByTestId('split-pane-left')).not.toBeInTheDocument()
    expect(screen.queryByTestId('split-pane-right')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /preview/i })).toBeInTheDocument()
  })
})
