import { useMemo } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import DOMPurify from 'dompurify'
import { logger } from '../utils/logger'
import { APP_CONFIG } from '../utils/constants'

export interface MarkdownProcessingOptions {
  enableGfm?: boolean
  enableHighlight?: boolean
  sanitize?: boolean
  enableVirtualization?: boolean
  chunkSize?: number
}

// Cache for processed processors to avoid recreation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processorCache = new Map<string, any>()

// Create processor with caching
const createProcessor = (options: MarkdownProcessingOptions) => {
  const cacheKey = `${options.enableGfm}-${options.enableHighlight}`
  
  if (processorCache.has(cacheKey)) {
    return processorCache.get(cacheKey)!
  }

  const processor = unified()
    .use(remarkParse)
    .use(options.enableGfm ? remarkGfm : () => {})
    .use(remarkRehype)
    .use(options.enableHighlight ? rehypeHighlight : () => {})
    .use(rehypeStringify)

  processorCache.set(cacheKey, processor)
  return processor
}

// Chunked processing for large content
const processLargeContent = (content: string, options: MarkdownProcessingOptions) => {
  const chunkSize = options.chunkSize || 50000 // 50KB chunks
  const chunks = []
  
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize))
  }
  
  const processor = createProcessor(options)
  const processedChunks = chunks.map(chunk => {
    try {
      const result = processor.processSync(chunk)
      return String(result)
    } catch (error) {
      console.error('Chunk processing error:', error)
      return '<p>Error processing markdown chunk</p>'
    }
  })
  
  return processedChunks.join('')
}

export const useMarkdown = (
  content: string,
  options: MarkdownProcessingOptions = {}
) => {
  const {
    enableGfm = true,
    enableHighlight = true,
    sanitize = true,
    enableVirtualization = false,
    chunkSize = 50000
  } = options

  // Memoize DOMPurify config to avoid recreation
  const purifyConfig = useMemo(() => ({
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'del', 's',
      'blockquote', 'code', 'pre',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'a', 'img',
      'div', 'span',
      'input', // For checkboxes
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src',
      'class', 'id',
      'type', 'checked', 'disabled', // For checkboxes
      'data-*',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  }), [])

  const processedContent = useMemo(() => {
    if (!content || content.trim() === '') {
      return ''
    }

    // Performance check for very large content
    const isLargeContent = content.length > APP_CONFIG.MAX_FILE_SIZE / 2 // 5MB threshold
    
    if (isLargeContent && !enableVirtualization) {
      logger.warn('Large markdown content detected. Consider enabling virtualization for better performance.')
    }

    try {
      let htmlString: string

      // Use chunked processing for very large content
      if (isLargeContent && enableVirtualization) {
        htmlString = processLargeContent(content, { enableGfm, enableHighlight, chunkSize })
      } else {
        // Standard processing
        const processor = createProcessor({ enableGfm, enableHighlight })
        const result = processor.processSync(content)
        htmlString = String(result)
      }

      // Sanitize HTML to prevent XSS attacks
      if (sanitize) {
        htmlString = DOMPurify.sanitize(htmlString, purifyConfig)
      }

      return htmlString
    } catch (error) {
      logger.error('Markdown processing error:', error)
      return '<p>Error processing markdown content</p>'
    }
  }, [content, enableGfm, enableHighlight, sanitize, enableVirtualization, chunkSize, purifyConfig])

  return processedContent
}

// Hook for processing markdown with performance monitoring
export const useOptimizedMarkdown = (
  content: string, 
  options: MarkdownProcessingOptions = {}
) => {
  const startTime = useMemo(() => Date.now(), [])
  
  // Enhanced options with automatic optimizations for large content
  const enhancedOptions = useMemo(() => {
    const contentLength = content.length
    
    return {
      ...options,
      // Auto-enable virtualization for content > 100KB
      enableVirtualization: contentLength > 100000 || options.enableVirtualization,
      // Adjust chunk size based on content size
      chunkSize: contentLength > 1000000 ? 100000 : // 100KB chunks for >1MB
                contentLength > 500000 ? 75000 :   // 75KB chunks for >500KB
                options.chunkSize || 50000,         // Default 50KB chunks
      // Disable highlighting for very large content to improve performance
      enableHighlight: contentLength > 2000000 ? false : (options.enableHighlight ?? true)
    }
  }, [content.length, options])
  
  const processedContent = useMarkdown(content, enhancedOptions)

  // Performance monitoring with detailed metrics
  useMemo(() => {
    if (import.meta.env.DEV && content.length > 10000) {
      const processingTime = Date.now() - startTime
      const contentSizeKB = (content.length / 1024).toFixed(2)
      const throughputKBps = (content.length / 1024 / (processingTime / 1000)).toFixed(2)
      
      logger.debug(`Markdown processing performance:`, {
        processingTime: `${processingTime}ms`,
        contentSize: `${contentSizeKB}KB`,
        throughput: `${throughputKBps}KB/s`,
        virtualizationEnabled: enhancedOptions.enableVirtualization,
        chunkSize: enhancedOptions.chunkSize,
        highlightingEnabled: enhancedOptions.enableHighlight
      })
      
      // Warn about potential performance issues
      if (processingTime > 1000) {
        logger.warn('Slow markdown processing detected. Consider enabling virtualization or reducing content size.')
      }
    }
  }, [content.length, startTime, enhancedOptions])

  return processedContent
}
