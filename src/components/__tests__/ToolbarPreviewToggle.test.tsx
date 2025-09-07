import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import Toolbar from '../Toolbar'

describe('Toolbar Preview Toggle', () => {
  test('renders slide switch and reflects checked state', () => {
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

    const sw = screen.getByRole('switch', { name: /preview only/i }) as HTMLInputElement
    expect(sw.checked).toBe(false)

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

    expect((screen.getByRole('switch', { name: /preview only/i }) as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole('switch', { name: /preview only/i }))
    expect(onToggle).toHaveBeenCalled()
  })
})
