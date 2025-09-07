import DOMPurify from 'dompurify'

// Centralized sanitizer to keep Preview/VirtualizedPreview/useMarkdown consistent
export const sanitizeHtml = (html: string): string => {
  const config = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'del', 's',
      'blockquote', 'code', 'pre',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'a', 'img',
      'div', 'span',
      'input',
    ] as string[],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src',
      'class', 'id',
      'type', 'checked', 'disabled',
      'data-*',
    ] as string[],
    // Allow common safe URI schemes; explicitly excludes javascript: by omission
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    // Allow data-* attributes safely
    ALLOW_DATA_ATTR: true,
  }

  return DOMPurify.sanitize(html, config)
}

export default sanitizeHtml
