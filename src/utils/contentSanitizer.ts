/**
 * Utility functions for cleaning and sanitizing blog content
 */

export const sanitizeHtmlContent = (html: string): string => {
  if (!html) return '';
  
  // Remove code fences and extract clean HTML
  let cleanHtml = html
    .replace(/```html\s*\n?/gi, '') // Remove opening code fence
    .replace(/```\s*$/gi, '') // Remove closing code fence
    .replace(/^<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '') // Remove DOCTYPE and head
    .replace(/<\/body>[\s\S]*?<\/html>\s*$/i, '') // Remove closing body and html
    .trim();
  
  // If content doesn't have proper HTML structure, convert plain text to proper paragraphs
  if (!cleanHtml.includes('<p>') && !cleanHtml.includes('<h') && !cleanHtml.includes('<div>')) {
    // Split by double line breaks for paragraphs
    const paragraphs = cleanHtml.split(/\n\s*\n/);
    cleanHtml = paragraphs
      .map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Convert single line breaks to <br> tags within paragraphs
        const withBreaks = trimmed.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      })
      .filter(p => p)
      .join('\n');
  }
  
  return cleanHtml;
};

export const generateSlugFromTitle = (title: string): string => {
  if (!title) return 'untitled-post';
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
};

export const ensureImageFallback = (imageUrl: string | null | undefined, title: string | null): string => {
  // If we have a valid image URL, return it
  if (imageUrl && imageUrl.trim() && !imageUrl.includes('data:image/png;base64,')) {
    return imageUrl;
  }
  
  // Generate a placeholder image URL based on title
  const encodedTitle = encodeURIComponent(title || 'Emergency Safety Article');
  return `https://images.unsplash.com/photo-1509475826633-fed577a2c71b?w=800&h=400&fit=crop&crop=center&auto=format&q=80&txt=${encodedTitle}`;
};