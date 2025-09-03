import { forwardRef } from 'react'
import { useMarkdown } from '../hooks/useMarkdown'
import './Preview.css'

interface PreviewProps {
  content?: string
}

const Preview = forwardRef<HTMLDivElement, PreviewProps>(({ content = '' }, ref) => {
  const processedContent = useMarkdown(content, {
    enableGfm: true,
    enableHighlight: true,
    sanitize: true,
  })

  return (
    <div className="preview" ref={ref}>
      <div className="preview-header">
        <h3>Preview</h3>
      </div>
      <div className="preview-content">
        {processedContent ? (
          <div
            className="markdown-body"
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