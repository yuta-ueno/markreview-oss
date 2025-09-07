import { describe, it, expect } from 'vitest'
import { useScrollSync } from '../useScrollSync'

// This test only checks type-level compatibility of returned refs.
// It doesn't render; it ensures the returned ref callbacks can be
// assigned to components expecting HTMLDivElement refs.
describe('useScrollSync types', () => {
  it('returns ref callbacks compatible with HTMLDivElement', () => {
    const { editorScrollRef, previewScrollRef } = useScrollSync({ enabled: false })
    // Pretend components accept HTMLDivElement refs; ensure callable
    expect(typeof editorScrollRef).toBe('function')
    expect(typeof previewScrollRef).toBe('function')
  })
})

