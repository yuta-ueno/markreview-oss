import { forwardRef } from 'react'
import { useOptimizedMarkdown } from '../hooks/useMarkdown'
import { AppSettings } from '../types/settings'
import './Preview.css'

interface PreviewProps {
  content?: string
  settings: AppSettings
}

const Preview = forwardRef<HTMLDivElement, PreviewProps>(({ content = '', settings }, ref) => {
  const processedContent = useOptimizedMarkdown(content, {
    enableGfm: true,
    enableHighlight: true,
    sanitize: true,
  })

  // Show virtualization info for large content
  const isLargeContent = content.length > 100000
  const shouldVirtualize = content.length > 500000 // 500KB threshold for virtualization

  return (
    <div className="preview" ref={ref}>
      <div className="preview-header">
        <h3>Preview</h3>
        {isLargeContent && (
          <span className="preview-size-info">
            {Math.round(content.length / 1024)}KB
            {shouldVirtualize && ' (Optimized for large content)'}
          </span>
        )}
      </div>
      <div className="preview-content">
        {processedContent ? (
          <div
            className="markdown-body"
            data-theme={settings.theme}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        ) : (
          <div className="preview-placeholder">
            <p>Start typing in the editor to see your markdown preview here...</p>
          </div>
        )}
      </div>
    </div>
  )
})

Preview.displayName = 'Preview'

export default Preview