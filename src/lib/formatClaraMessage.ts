/**
 * Converts basic markdown in CLARA's responses to safe HTML.
 * Handles: **bold**, *italic*, `code`, and newlines.
 * Escapes HTML entities first to prevent XSS.
 */
export function formatClaraMessage(text: string): string {
  return text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Then convert markdown to HTML
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.1);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>')
    .replace(/\n/g, '<br/>');
}
