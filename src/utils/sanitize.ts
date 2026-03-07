import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering via dangerouslySetInnerHTML.
 * Allows basic formatting tags but strips all scripts, event handlers, and dangerous elements.
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr', 'div', 'span',
      'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'figure', 'figcaption',
      'details', 'summary',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'style', 'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strict sanitization - only allows inline text formatting, no links or images.
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'u', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
  });
}
