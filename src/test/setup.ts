import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Tauri APIs for testing
Object.defineProperty(window, '__TAURI__', {
  value: {
    tauri: {
      invoke: vi.fn(),
    },
    dialog: {
      open: vi.fn(),
      save: vi.fn(),
    },
    fs: {
      readTextFile: vi.fn(),
      writeTextFile: vi.fn(),
    },
  },
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
})

// Suppress console warnings during tests
const originalWarn = console.warn
console.warn = (message: unknown, ...args: unknown[]) => {
  // Suppress specific warnings that are expected in test environment
  if (
    typeof message === 'string' &&
    (message.includes('React does not recognize') ||
     message.includes('Warning: validateDOMNesting'))
  ) {
    return
  }
  originalWarn(message, ...args)
}