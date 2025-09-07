import React, { forwardRef, memo, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import sanitizeHtml from '../utils/sanitizeHtml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { useOptimizedMarkdown } from '../hooks/useMarkdown'
import './Preview.css'

interface VirtualizedPreviewProps {
  content?: string
  itemHeight?: number // default estimate used until measured
  containerHeight?: number
  overscan?: number
}

interface VirtualItem {
  index: number
  start: number
  end: number
  content: string
}

const VirtualizedPreview = memo(forwardRef<HTMLDivElement, VirtualizedPreviewProps>(({ 
  content = '', 
  itemHeight = 50,
  containerHeight = 600,
  overscan = 5
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const heightsRef = useRef<Map<number, number>>(new Map())
  const [avgHeight, setAvgHeight] = useState(itemHeight)
  const htmlCacheRef = useRef<Map<number, string>>(new Map())
  const processorRef = useRef<any>(null)
  
  // Split content into paragraph/code blocks for virtualization
  const contentChunks = useMemo(() => {
    if (!content || content.length < 50000) return [] as string[]
    const out: string[] = []
    const lines = content.split('\n')
    let cur: string[] = []
    let inFence = false
    const flush = () => { if (cur.length) { out.push(cur.join('\n')); cur = [] } }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const fence = line.match(/^(```+|~~~+)/)
      if (fence) { inFence = !inFence; cur.push(line); continue }
      if (inFence) { cur.push(line); continue }
      if (/^\s*$/.test(line)) { flush(); continue }
      if (/^\s*#{1,6}\s+/.test(line)) { flush(); cur.push(line); flush(); continue }
      if (/^\s*([-*_])\s*\1\s*\1\s*$/.test(line)) { flush(); out.push(line); flush(); continue }
      // default: paragraph/list lines accumulate
      cur.push(line)
    }
    flush()
    return out
  }, [content])
  
  // Helpers for dynamic heights
  const getHeight = useCallback((idx: number) => heightsRef.current.get(idx) ?? avgHeight, [avgHeight])

  const getEstimatedTop = useCallback((idx: number) => {
    let sum = 0
    for (let i = 0; i < idx; i++) sum += getHeight(i)
    return sum
  }, [getHeight])

  const getEstimatedTotal = useCallback(() => {
    let sum = 0
    for (let i = 0; i < contentChunks.length; i++) sum += getHeight(i)
    return sum
  }, [contentChunks.length, getHeight])

  // Calculate visible items based on scroll using cumulative heights
  const visibleItems = useMemo(() => {
    if (contentChunks.length === 0) return []

    // find start index
    let start = 0
    let acc = 0
    while (start < contentChunks.length && acc + getHeight(start) < scrollTop) {
      acc += getHeight(start)
      start++
    }

    // find end index
    let end = start
    let pos = acc
    const limit = scrollTop + containerHeight
    while (end < contentChunks.length && pos < limit) {
      pos += getHeight(end)
      end++
    }

    start = Math.max(0, start - overscan)
    end = Math.min(contentChunks.length, end + overscan)

    const items: VirtualItem[] = []
    let top = getEstimatedTop(start)
    for (let i = start; i < end; i++) {
      const h = getHeight(i)
      items.push({ index: i, start: top, end: top + h, content: contentChunks[i] })
      top += h
    }
    return items
  }, [contentChunks, scrollTop, containerHeight, overscan, getHeight, getEstimatedTop])
  
  // Process only visible content blocks (with caching and markdown pipeline)
  const processedChunks = useMemo(() => {
    const processed = new Map<number, string>()
    visibleItems.forEach(item => {
      const cached = htmlCacheRef.current.get(item.index)
      if (cached) { processed.set(item.index, cached); return }
      if (!processorRef.current) {
        processorRef.current = unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype)
          .use(rehypeHighlight)
          .use(rehypeStringify)
      }
      try {
        const proc = processorRef.current as any
        const result = proc.processSync(item.content)
        const html = sanitizeHtml(String(result))
        htmlCacheRef.current.set(item.index, html)
        processed.set(item.index, html)
      } catch {
        processed.set(item.index, '<p>Render error</p>')
      }
    })
    return processed
  }, [visibleItems])
  
  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  // Use regular preview for small content
  const regularProcessedContent = useOptimizedMarkdown(content, {
    enableGfm: true,
    enableHighlight: true,
    sanitize: true,
  })
  
  // Return regular preview for small content
  if (content.length < 50000) {
    return (
      <div className="preview" ref={ref}>
        <div className="preview-header">
          <h3>Preview</h3>
        </div>
        <div className="preview-content">
          {regularProcessedContent ? (
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: regularProcessedContent }}
            />
          ) : (
            <div className="preview-placeholder">
              <p>Start typing in the editor to see your markdown preview here...</p>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Virtualized preview for large content
  return (
    <div className="preview" ref={ref}>
      <div className="preview-header">
        <h3>Preview (Virtualized)</h3>
        <span className="preview-info">
          {Math.round(content.length / 1024)}KB content, {contentChunks.length} chunks
        </span>
      </div>
      <div 
        className="preview-content virtualized"
        style={{ height: containerHeight, overflowY: 'auto' }}
        onScroll={handleScroll}
        ref={containerRef}
      >
        <div style={{ height: getEstimatedTotal(), position: 'relative' }}>
          {visibleItems.map(item => {
            const processedContent = processedChunks.get(item.index) || ''
            return (
              <div
                key={item.index}
                style={{
                  position: 'absolute',
                  top: item.start,
                  left: 0,
                  right: 0,
                  minHeight: itemHeight,
                }}
                className="virtual-item"
              >
                <MeasuredChunk index={item.index} html={processedContent} onMeasure={(idx, h) => {
                  const prev = heightsRef.current.get(idx)
                  if (prev !== h) {
                    heightsRef.current.set(idx, h)
                    const vals = Array.from(heightsRef.current.values())
                    if (vals.length) setAvgHeight(vals.reduce((a, b) => a + b, 0) / vals.length)
                  }
                }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}))

VirtualizedPreview.displayName = 'VirtualizedPreview'

export default VirtualizedPreview

// Helper chunk component that reports its rendered height
const MeasuredChunk: React.FC<{ index: number; html: string; onMeasure: (index: number, h: number) => void }>
  = ({ index, html, onMeasure }) => {
  const elRef = useRef<HTMLDivElement | null>(null)

  const measure = useCallback(() => {
    if (elRef.current) onMeasure(index, elRef.current.offsetHeight)
  }, [index, onMeasure])

  useEffect(() => { measure() }, [measure, html])

  useEffect(() => {
    if (!elRef.current || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(elRef.current)
    return () => ro.disconnect()
  }, [measure])

  return html ? (
    <div className="markdown-body" ref={elRef} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div ref={elRef} className="chunk-loading">Loading chunk {index + 1}...</div>
  )
}
