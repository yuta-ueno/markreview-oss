import { forwardRef } from 'react'
import { useOptimizedMarkdown } from '../hooks/useMarkdown'
import { isMarkdocAvailable, getProUpgradeMessage } from '../utils/proVersion'
import { AppSettings } from '../types/settings'
import './Preview.css'

interface PreviewProps {
  content?: string
  settings: AppSettings
}

const Preview = forwardRef<HTMLDivElement, PreviewProps>(({ content = '', settings }, ref) => {
  // In OSS builds, Markdoc is never available
  const containsMarkdoc = false

  // Simple Markdoc syntax detection for UI purposes only
  const hasBasicMarkdocSyntax = /\{%\s*\w+|\{\{\s*[\w$]/.test(content)
  const markdocUnavailable = hasBasicMarkdocSyntax && !isMarkdocAvailable()

  const processedContent = useOptimizedMarkdown(content, {
    enableGfm: true,
    enableHighlight: true,
    sanitize: true,
    enableMarkdoc: true,
  })

  // Show virtualization info for large content
  const isLargeContent = content.length > 100000
  const shouldVirtualize = content.length > 500000 // 500KB threshold for virtualization

  return (
    <div className="preview" ref={ref}>
      <div className="preview-header">
        <h3>Preview</h3>
        <div className="preview-info">
          {containsMarkdoc && (
            <span className="preview-markdoc-indicator">Markdoc Pro</span>
          )}
          {markdocUnavailable && (
            <span className="preview-markdoc-unavailable" title={getProUpgradeMessage('markdoc')}>
              Markdoc (Pro Only)
            </span>
          )}
          {isLargeContent && (
            <span className="preview-size-info">
              {Math.round(content.length / 1024)}KB
              {shouldVirtualize && ' (Optimized)'}
            </span>
          )}
        </div>
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
            <p className="preview-hint">
              {isMarkdocAvailable() ? (
                <>Try Markdoc syntax like: <code>{'{% callout %}'}</code>, <code>{'{{ variable }}'}</code>, <code>{'{{ $function() }}'}</code></>
              ) : (
                <>Standard Markdown is supported. Markdoc features require <strong>MarkReview Pro</strong>.</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

Preview.displayName = 'Preview'

export default Preview