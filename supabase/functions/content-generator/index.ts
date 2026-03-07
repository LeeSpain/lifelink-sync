import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  campaignId: string;
  contentType: string;
  platform: string;
  targetAudience: string;
  tone: string;
  keywords?: string[];
  imageStyle?: string;
  wordCount?: number;
  includeImage: boolean;
  urgency: string;
  scheduledTime?: string;
  additionalInstructions?: string;
}

interface GeneratedContent {
  title: string;
  body: string;
  hashtags: string[];
  imagePrompt?: string;
  imageUrl?: string;
  seoTitle?: string;
  metaDescription?: string;
  scheduledTime?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const contentRequest: ContentRequest = await req.json();
    console.log('Processing content generation request:', contentRequest);

    // Generate content based on type and platform
    const generatedContent = await generateContent(contentRequest, openaiApiKey);
    
    // Generate image if requested
    if (contentRequest.includeImage && generatedContent.imagePrompt) {
      generatedContent.imageUrl = await generateImage(generatedContent.imagePrompt, openaiApiKey);
    }

    // Store in database
    const contentId = await storeGeneratedContent(contentRequest, generatedContent);

    // Schedule for posting if time specified
    if (contentRequest.scheduledTime) {
      await scheduleContent(contentId, contentRequest.scheduledTime, contentRequest.platform);
    }

    return new Response(JSON.stringify({
      success: true,
      contentId,
      content: generatedContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content generation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

async function generateContent(request: ContentRequest, apiKey: string): Promise<GeneratedContent> {
  const contentPrompts = {
    'social_post': `Create an engaging social media post about family safety and emergency preparedness.
Target Audience: ${request.targetAudience}
Tone: ${request.tone}
Platform: ${request.platform}
Keywords: ${request.keywords?.join(', ') || 'family safety, emergency preparedness'}
Word Count: ${request.wordCount || 150} words max

Include:
- Compelling hook
- Actionable safety tip
- Call to action
- 3-5 relevant hashtags
${request.includeImage ? '- Detailed image description for visual generation' : ''}

Additional instructions: ${request.additionalInstructions || 'None'}`,

    'blog_post': `Write a comprehensive blog post about family emergency preparedness.
Target Audience: ${request.targetAudience}
Tone: ${request.tone}
Keywords: ${request.keywords?.join(', ') || 'family safety, emergency planning'}
Word Count: ${request.wordCount || 1200} words

Structure:
1. SEO-optimized title (60 chars max)
2. Meta description (160 chars max)
3. Introduction with hook
4. 3-5 main sections with actionable advice
5. Conclusion with clear CTA
6. Include safety statistics and expert tips
${request.includeImage ? '7. Hero image description for generation' : ''}

Additional instructions: ${request.additionalInstructions || 'Focus on practical, actionable advice'}`,

    'email_campaign': `Create a personalized email campaign about family safety solutions.
Target Audience: ${request.targetAudience}
Tone: ${request.tone}
Purpose: Educational and promotional
Word Count: ${request.wordCount || 400} words

Structure your response as:
1. Subject Line (compelling, 50 chars max, no quotation marks)
2. Preheader Text (preview text, 90 chars max)
3. Email Body (HTML-friendly, use tables for layout)
4. Call-to-Action (clear button text)
5. Personalization tags: {{name}}, {{email}}

Format:
- Use email-friendly HTML (tables, inline CSS)
- Include personalization placeholders
- Focus on value and benefits
- Professional but warm tone
- Clear hierarchy with headers
${request.includeImage ? '- Header image description for email hero image' : ''}

Additional instructions: ${request.additionalInstructions || 'Focus on trust-building and peace of mind'}`,

    'video_script': `Write a video script about family emergency preparedness.
Duration: 60-90 seconds
Target Audience: ${request.targetAudience}
Tone: ${request.tone}

Format:
- Hook (first 5 seconds)
- Problem presentation
- Solution introduction
- Key benefits (3 main points)
- Strong call-to-action
- Include visual cues and timing

Additional instructions: ${request.additionalInstructions || 'Keep engaging and informative'}`
  };

  const prompt = contentPrompts[request.contentType as keyof typeof contentPrompts] || contentPrompts.social_post;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `You are a professional content creator specializing in family safety and emergency preparedness. Create engaging, informative content that builds trust and provides real value. Always prioritize safety and accurate information.

IMPORTANT: Adjust your response format based on content type:

For EMAIL CAMPAIGNS:
{
  "title": "Subject line (50 chars max)",
  "body": "Email HTML body with personalization tags {{name}}, {{email}}",
  "hashtags": [],
  "imagePrompt": "Email hero image description (if requested)",
  "emailSubject": "Subject line",
  "preheaderText": "Preview text for email",
  "callToAction": "Button text"
}

For BLOG POSTS:
{
  "title": "Blog post title",
  "body": "Full blog content with sections",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "imagePrompt": "Blog hero image description (if requested)",
  "seoTitle": "SEO-optimized title (60 chars max)",
  "metaDescription": "Meta description (160 chars max)"
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: 1500,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const contentText = data.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(contentText);
    
    // Ensure email content has proper structure
    if (request.contentType === 'email_campaign') {
      return {
        title: parsed.emailSubject || parsed.title,
        body: parsed.body,
        hashtags: [],
        imagePrompt: parsed.imagePrompt,
        emailSubject: parsed.emailSubject || parsed.title,
        preheaderText: parsed.preheaderText || "",
        callToAction: parsed.callToAction || "Learn More"
      };
    }
    
    return parsed;
  } catch {
    // Fallback if JSON parsing fails
    if (request.contentType === 'email_campaign') {
      return {
        title: "Important Family Safety Update",
        body: contentText,
        hashtags: [],
        imagePrompt: request.includeImage ? "Professional email header showing family safety and security" : undefined,
        emailSubject: "Important Family Safety Update",
        preheaderText: "Keep your family safe with these essential tips",
        callToAction: "Learn More"
      };
    }
    
    return {
      title: "Generated Content",
      body: contentText,
      hashtags: ["#FamilySafety", "#EmergencyPrep", "#Safety"],
      imagePrompt: request.includeImage ? "Professional image showing a happy family feeling safe and secure" : undefined
    };
  }
}

async function generateImage(imagePrompt: string, apiKey: string): Promise<string> {
  console.log('Generating image with prompt:', imagePrompt);
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: imagePrompt + " - High quality, professional, suitable for social media marketing",
      size: '1024x1024',
      quality: 'high',
      output_format: 'png',
      n: 1
    }),
  });

  if (!response.ok) {
    console.error('Image generation failed:', await response.text());
    throw new Error(`Image generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // gpt-image-1 returns base64, we need to convert and store
  if (data.data && data.data[0]) {
    const base64Image = data.data[0].b64_json;
    if (base64Image) {
      // In production, upload to storage and return URL
      // For now, return base64 data URL
      return `data:image/png;base64,${base64Image}`;
    }
  }
  
  throw new Error('No image data received');
}

async function storeGeneratedContent(request: ContentRequest, content: GeneratedContent): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  // Store in marketing_content table with proper email/blog differentiation
  const contentData = {
    campaign_id: request.campaignId,
    platform: request.platform,
    content_type: request.contentType,
    title: content.title,
    body_text: content.body,
    hashtags: content.hashtags || [],
    image_url: content.imageUrl,
    scheduled_time: content.scheduledTime,
    status: request.scheduledTime ? 'scheduled' : 'draft',
    engagement_metrics: {}
  };

  // Add email-specific fields
  if (request.contentType === 'email_campaign') {
    contentData.content_sections = {
      email_subject: content.emailSubject || content.title,
      preheader_text: content.preheaderText || "",
      call_to_action: content.callToAction || "Learn More",
      email_type: "marketing"
    };
  } else {
    // Add blog-specific fields
    contentData.seo_title = content.seoTitle;
    contentData.meta_description = content.metaDescription;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/marketing_content`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
    },
    body: JSON.stringify(contentData),
  });

  if (!response.ok) {
    throw new Error(`Failed to store content: ${response.statusText}`);
  }

  const result = await response.json();
  return result[0]?.id || 'unknown';
}

async function scheduleContent(contentId: string, scheduledTime: string, platform: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  // Route to appropriate queue based on platform
  if (platform === 'email') {
    // Add to email queue (handled by email-campaign-creator)
    console.log('Email content will be handled by email-campaign-creator function');
  } else {
    // Add to social media posting queue for other platforms
    await fetch(`${supabaseUrl}/rest/v1/social_media_posting_queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        content_id: contentId,
        platform,
        scheduled_time: scheduledTime,
        status: 'scheduled',
        retry_count: 0
      }),
    });
  }
}

serve(handler);