import React, { forwardRef, memo, useMemo, useRef, useState, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { useOptimizedMarkdown } from '../hooks/useMarkdown'
import './Preview.css'

interface VirtualizedPreviewProps {
  content?: string
  itemHeight?: number
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
  
  // Calculate visible items based on scroll position
  const visibleItems = useMemo(() => {
    if (contentChunks.length === 0) return []
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      contentChunks.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    const items: VirtualItem[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        content: contentChunks[i]
      })
    }
    
    return items
  }, [contentChunks, scrollTop, itemHeight, containerHeight, overscan])
  
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
        <div style={{ height: contentChunks.length * itemHeight, position: 'relative' }}>
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
                {processedContent ? (
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
                ) : (
                  <div className="chunk-loading">Loading chunk {item.index + 1}...</div>
                )}
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
