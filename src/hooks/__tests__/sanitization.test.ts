import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useMarkdown } from '../../hooks/useMarkdown'
import sanitizeHtml from '../../utils/sanitizeHtml'

describe('Sanitization', () => {
  it('removes script tags', () => {
    const input = '<p>Hello</p><script>alert(1)</script>'
    const out = sanitizeHtml(input)
    expect(out).toContain('<p>Hello</p>')
    expect(out).not.toContain('<script')
  })

  it('strips javascript: URLs in href', () => {
    const input = '<a href="javascript:alert(1)">click</a>'
    const out = sanitizeHtml(input)
    expect(out).toContain('<a>click</a>')
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('href=')
  })

  it('removes event handler attributes (onerror)', () => {
    const input = '<img src="x" onerror="alert(1)"><p>ok</p>'
    const out = sanitizeHtml(input)
    expect(out).toContain('<img src="x">')
    expect(out).not.toContain('onerror')
  })

  it('useMarkdown returns sanitized HTML by default', () => {
    const md = '[x](javascript:alert(1))\n\n<img src="x" onerror="1">\n\n<script>alert(1)</script>'
    const { result } = renderHook(() => useMarkdown(md, { sanitize: true }))
    const html = result.current
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script')
  })
})

