import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import Toolbar from '../Toolbar'

describe('Toolbar Edit On button', () => {
  test('renders switch and reflects checked state', () => {
    const onToggle = vi.fn()

    const { rerender } = render(
      <Toolbar
        onNew={vi.fn()}
        onOpen={vi.fn() as any}
        onSave={vi.fn()}
        onSettings={vi.fn()}
        onToggleViewMode={onToggle}
        viewMode="split"
        content=""
        filename="doc.md"
      />
    )

    // Accessible name changed to "Edit Mode" and semantics:
    // aria-checked=true when editing is enabled (viewMode !== 'preview').
    const sw = screen.getByRole('switch', { name: /edit mode/i }) as HTMLButtonElement
    expect(sw.getAttribute('aria-checked')).toBe('true')

    // simulate external state change to preview mode
    rerender(
      <Toolbar
        onNew={vi.fn()}
        onOpen={vi.fn() as any}
        onSave={vi.fn()}
        onSettings={vi.fn()}
        onToggleViewMode={onToggle}
        viewMode="preview"
        content=""
        filename="doc.md"
      />
    )

    const sw2 = screen.getByRole('switch', { name: /edit mode/i }) as HTMLButtonElement
    expect(sw2.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(sw2)
    expect(onToggle).toHaveBeenCalled()
  })
})
