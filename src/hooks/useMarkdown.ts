import { useMemo } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import DOMPurify from 'dompurify'

export interface MarkdownProcessingOptions {
  enableGfm?: boolean
  enableHighlight?: boolean
  sanitize?: boolean
}

export const useMarkdown = (
  content: string,
  options: MarkdownProcessingOptions = {}
) => {
  const {
    enableGfm = true,
    enableHighlight = true,
    sanitize = true,
  } = options

  const processedContent = useMemo(() => {
    if (!content || content.trim() === '') {
      return ''
    }

    try {
      const processor = unified()
        .use(remarkParse)
        .use(enableGfm ? remarkGfm : () => {})
        .use(remarkRehype)
        .use(enableHighlight ? rehypeHighlight : () => {})
        .use(rehypeStringify)

      const result = processor.processSync(content)
      let htmlString = String(result)

      // Sanitize HTML to prevent XSS attacks
      if (sanitize) {
        htmlString = DOMPurify.sanitize(htmlString, {
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
        })
      }

      return htmlString
    } catch (error) {
      console.error('Markdown processing error:', error)
      return '<p>Error processing markdown content</p>'
    }
  }, [content, enableGfm, enableHighlight, sanitize])

  return processedContent
}