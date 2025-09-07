import React, { forwardRef, memo, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import DOMPurify from 'dompurify'
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
  
  // Split content into chunks for virtualization
  const contentChunks = useMemo(() => {
    if (!content || content.length < 50000) return []
    
    const lines = content.split('\n')
    const chunkSize = Math.max(50, Math.floor(lines.length / Math.ceil(content.length / 10000)))
    const chunks: string[] = []
    
    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize).join('\n'))
    }
    
    return chunks
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
  
  // Process only visible content chunks
  const processedChunks = useMemo(() => {
    const processed = new Map<number, string>()
    
    visibleItems.forEach(item => {
      // For now, we'll use a simpler approach without the hook in forEach
      // This will be improved in a future iteration
      const simpleHtml = `<div class="virtual-chunk">${item.content.replace(/\n/g, '<br>')}</div>`
      const sanitized = DOMPurify.sanitize(simpleHtml)
      processed.set(item.index, sanitized)
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
