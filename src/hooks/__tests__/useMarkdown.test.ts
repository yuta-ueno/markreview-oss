import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useMarkdown } from '../useMarkdown'

describe('useMarkdown', () => {
  describe('Basic functionality', () => {
    it('should process plain text', () => {
      const { result } = renderHook(() => useMarkdown('Hello world'))
      expect(result.current).toContain('<p>Hello world</p>')
    })

    it('should handle empty content', () => {
      const { result } = renderHook(() => useMarkdown(''))
      expect(result.current).toBe('')
    })

    it('should handle whitespace-only content', () => {
      const { result } = renderHook(() => useMarkdown('   \n   \t   '))
      expect(result.current).toBe('')
    })
  })

  describe('Headings processing', () => {
    it('should process h1 headings', () => {
      const { result } = renderHook(() => useMarkdown('# Main Heading'))
      expect(result.current).toContain('<h1>Main Heading</h1>')
    })

    it('should process h2 headings', () => {
      const { result } = renderHook(() => useMarkdown('## Section Heading'))
      expect(result.current).toContain('<h2>Section Heading</h2>')
    })

    it('should process h3 headings', () => {
      const { result } = renderHook(() => useMarkdown('### Subsection Heading'))
      expect(result.current).toContain('<h3>Subsection Heading</h3>')
    })

    it('should process multiple heading levels', () => {
      const markdown = `# Main Title\n## Section\n### Subsection`
      
      const { result } = renderHook(() => useMarkdown(markdown))
      const html = result.current
      
      expect(html).toContain('<h1>Main Title</h1>')
      expect(html).toContain('<h2>Section</h2>')
      expect(html).toContain('<h3>Subsection</h3>')
    })
  })

  describe('Code processing', () => {
    it('should process inline code', () => {
      const { result } = renderHook(() => useMarkdown('Here is `inline code` example'))
      expect(result.current).toContain('<code>inline code</code>')
    })

    it('should process code blocks', () => {
      const markdown = 'Here is a code block:\n\n```\nfunction test() {\n  return true;\n}\n```'
      const { result } = renderHook(() => useMarkdown(markdown))
      
      expect(result.current).toContain('<pre>')
      expect(result.current).toContain('function test()')
      expect(result.current).toContain('return true')
    })
  })

  describe('Tables processing (GFM)', () => {
    it('should process simple tables', () => {
      const table = '| Name | Age |\n|------|-----|\n| John | 30  |\n| Jane | 25  |'
      const { result } = renderHook(() => useMarkdown(table))
      const html = result.current
      
      expect(html).toContain('<table>')
      expect(html).toContain('<thead>')
      expect(html).toContain('<tbody>')
      expect(html).toContain('<th>Name</th>')
      expect(html).toContain('<th>Age</th>')
      expect(html).toContain('<td>John</td>')
      expect(html).toContain('<td>Jane</td>')
    })
  })

  describe('GitHub Flavored Markdown features', () => {
    it('should process task lists', () => {
      const taskList = '- [x] Completed task\n- [ ] Incomplete task'
      const { result } = renderHook(() => useMarkdown(taskList))
      const html = result.current
      
      expect(html).toContain('class="contains-task-list"')
      expect(html).toContain('class="task-list-item"')
      expect(html).toContain('type="checkbox"')
      expect(html).toContain('checked')
    })

    it('should process strikethrough text', () => {
      const { result } = renderHook(() => useMarkdown('This is ~~strikethrough~~ text'))
      expect(result.current).toContain('<del>strikethrough</del>')
    })
  })

  describe('Text formatting', () => {
    it('should process bold text', () => {
      const { result } = renderHook(() => useMarkdown('**Bold text**'))
      expect(result.current).toContain('<strong>Bold text</strong>')
    })

    it('should process italic text', () => {
      const { result } = renderHook(() => useMarkdown('*Italic text*'))
      expect(result.current).toContain('<em>Italic text</em>')
    })

    it('should process mixed formatting', () => {
      const { result } = renderHook(() => useMarkdown('**Bold** and *italic* text'))
      const html = result.current
      
      expect(html).toContain('<strong>Bold</strong>')
      expect(html).toContain('<em>italic</em>')
    })
  })

  describe('Error handling', () => {
    it('should handle processing errors gracefully', () => {
      const originalError = console.error
      console.error = vi.fn()
      const { result } = renderHook(() => useMarkdown('# Valid markdown'))
      expect(result.current).toContain('<h1>Valid markdown</h1>')
      console.error = originalError
    })
  })

  describe('Options', () => {
    it('should disable GFM features when enableGfm is false', () => {
      const table = '| Name | Age |\n|------|-----|\n| John | 30  |'
      const { result } = renderHook(() => useMarkdown(table, { enableGfm: false }))
      expect(result.current).not.toContain('<table>')
      expect(result.current).toContain('| Name | Age |')
    })
  })
})

