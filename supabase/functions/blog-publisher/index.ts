import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, { 
      auth: { persistSession: false } 
    });

    const { action, contentId } = await req.json();

    switch (action) {
      case 'publish_blog':
        return await publishBlog(contentId, serviceSupabase);
      case 'generate_slug':
        return await generateSlug(await req.json(), serviceSupabase);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Blog publisher error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function publishBlog(contentId: string, supabase: any) {
  console.log('Publishing blog for content:', contentId);

  // Get content details
  const { data: content, error: fetchError } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchError) throw fetchError;

  // Clean the content before publishing
  const cleanedBodyText = sanitizeContentBeforePublish(content.body_text || '');

  // Generate SEO-friendly slug
  let slug = content.slug;
  if (!slug) {
    slug = generateSlugFromTitle(content.title || content.seo_title || 'untitled-post');
    
    // Ensure uniqueness
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('slug')
      .like('slug', `${slug}%`);

    if (existingPosts && existingPosts.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // Create blog post
  const blogPost = {
    content_id: contentId,
    title: content.title || content.seo_title,
    slug,
    content: cleanedBodyText,
    excerpt: content.meta_description || cleanedBodyText.substring(0, 200),
    featured_image: content.image_url,
    featured_image_alt: content.featured_image_alt || content.title,
    seo_title: content.seo_title || content.title,
    meta_description: content.meta_description,
    keywords: content.keywords || [],
    reading_time: content.reading_time || estimateReadingTime(cleanedBodyText),
    published_at: new Date().toISOString(),
    status: 'published'
  };

  const { data: insertedPost, error: insertError } = await supabase
    .from('blog_posts')
    .insert(blogPost)
    .select()
    .single();

  if (insertError) throw insertError;

  // Update content status and clean body_text
  await supabase
    .from('marketing_content')
    .update({
      status: 'published',
      posted_at: new Date().toISOString(),
      slug: slug,
      body_text: cleanedBodyText // Store cleaned content
    })
    .eq('id', contentId);

  return new Response(JSON.stringify({
    success: true,
    blog_post: insertedPost,
    blog_url: `/blog/${slug}`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function sanitizeContentBeforePublish(html: string): string {
  if (!html) return '';
  
  // Remove code fences and extract clean HTML
  let cleanHtml = html
    .replace(/```html\s*\n?/gi, '') // Remove opening code fence
    .replace(/```\s*$/gi, '') // Remove closing code fence
    .replace(/^<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '') // Remove DOCTYPE and head
    .replace(/<\/body>[\s\S]*?<\/html>\s*$/i, '') // Remove closing body and html
    .trim();
  
  return cleanHtml;
}

function generateSlugFromTitle(title: string): string {
  if (!title) return 'untitled-post';
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

function generateBlogHTML(content: any): string {
  const sections = content.content_sections || {};
  
  let html = '';
  
  // Introduction
  if (sections.introduction) {
    html += `<section class="introduction">
      <p class="lead">${sections.introduction}</p>
    </section>`;
  }

  // Main content
  if (content.body_text) {
    const paragraphs = content.body_text.split('\n\n');
    html += '<section class="main-content">';
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        html += `<p>${paragraph.trim()}</p>`;
      }
    });
    html += '</section>';
  }

  // Key benefits/points
  if (sections.benefits && Array.isArray(sections.benefits)) {
    html += '<section class="benefits">';
    html += '<h2>Key Benefits</h2>';
    html += '<ul>';
    sections.benefits.forEach(benefit => {
      html += `<li>${benefit}</li>`;
    });
    html += '</ul>';
    html += '</section>';
  }

  // Call to action
  if (sections.cta) {
    html += `<section class="call-to-action">
      <div class="cta-box">
        <h3>${sections.cta.title || 'Ready to Get Started?'}</h3>
        <p>${sections.cta.description || ''}</p>
        ${sections.cta.button_text ? `<button class="cta-button">${sections.cta.button_text}</button>` : ''}
      </div>
    </section>`;
  }

  return html;
}

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

async function generateSlug(data: any, supabase: any) {
  const { title } = data;
  const baseSlug = generateSlugFromTitle(title);
  
  // Check for uniqueness
  const { data: existingPosts } = await supabase
    .from('blog_posts')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  let finalSlug = baseSlug;
  if (existingPosts && existingPosts.length > 0) {
    finalSlug = `${baseSlug}-${Date.now()}`;
  }

  return new Response(JSON.stringify({ slug: finalSlug }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}