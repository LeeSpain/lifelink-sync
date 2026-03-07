import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageGenerationRequest {
  contentId?: string;
  prompt: string;
  platform: string;
  style?: string;
  size?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { contentId, prompt, platform, style = 'vivid', size = '1024x1024' }: ImageGenerationRequest = await req.json();

    console.log(`Generating image for content ${contentId ?? 'preview'}`, { prompt, platform, style, size });

    // Generate image with OpenAI first, then fallback to Hugging Face if needed
    const image = await generateImage(prompt, style, size, platform);

    if (contentId) {
      // Update content with generated image
      const { error: updateError } = await supabaseClient
        .from('marketing_content')
        .update({ 
          image_url: image,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (updateError) {
        console.error('Failed to update content with image:', updateError);
        throw new Error('Failed to save generated image');
      }

      // Log generation request
      await supabaseClient
        .from('content_generation_requests')
        .insert({
          campaign_id: null,
          content_type: 'image',
          platform,
          prompt,
          generated_image_url: image,
          status: 'completed',
          completed_at: new Date().toISOString(),
          generation_metadata: {
            style,
            size,
            model: 'gpt-image-1_or_hf'
          }
        });
    }

    return new Response(JSON.stringify({ 
      success: true,
      image,
      imageUrl: image,
      contentId: contentId ?? null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateImage(prompt: string, style: string, size: string, platform: string): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  // Enhance prompt based on platform and requirements
  const enhancedPrompt = enhancePromptForPlatform(prompt, platform);
  console.log('Generating image with enhanced prompt:', enhancedPrompt);

  if (openAIApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: enhancedPrompt,
          n: 1,
          size,
          quality: 'high'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0 && data.data[0].b64_json) {
          return `data:image/png;base64,${data.data[0].b64_json}`;
        }
        console.warn('OpenAI returned no b64_json, falling back to Hugging Face');
      } else {
        const errText = await response.text();
        console.error('OpenAI API error:', errText);
      }
    } catch (err) {
      console.error('OpenAI image generation failed, falling back to Hugging Face:', err);
    }
  } else {
    console.warn('OpenAI API key not configured, using Hugging Face');
  }

  // Fallback to Hugging Face
  return await generateImageWithHuggingFace(enhancedPrompt, platform);
}

function enhancePromptForPlatform(prompt: string, platform: string): string {
  const platformSpecs = {
    facebook: {
      aspectRatio: '16:9 or square format',
      style: 'professional and engaging',
      requirements: 'high-resolution, suitable for Facebook feed'
    },
    instagram: {
      aspectRatio: 'square 1:1 format',
      style: 'visually appealing and Instagram-ready',
      requirements: 'vibrant colors, aesthetic composition for Instagram'
    },
    twitter: {
      aspectRatio: '16:9 format',
      style: 'eye-catching and shareable',
      requirements: 'clear and readable for Twitter timeline'
    },
    linkedin: {
      aspectRatio: '16:9 format',
      style: 'professional and business-appropriate',
      requirements: 'corporate-friendly, suitable for LinkedIn professional network'
    },
    youtube: {
      aspectRatio: '16:9 format for thumbnail',
      style: 'attention-grabbing thumbnail style',
      requirements: 'YouTube thumbnail optimized, bold and clear'
    }
  };

  const spec = platformSpecs[platform as keyof typeof platformSpecs] || platformSpecs.facebook;

  return `${prompt}. Create this in ${spec.aspectRatio}, with a ${spec.style} aesthetic. ${spec.requirements}. High quality, professional, ultra-detailed, perfect composition.`;
}

// Alternative function using Hugging Face if OpenAI is not available
async function generateImageWithHuggingFace(prompt: string, platform: string): Promise<string> {
  const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
  if (!hfToken) {
    throw new Error('Hugging Face API token not configured');
  }

  const enhancedPrompt = enhancePromptForPlatform(prompt, platform);

  const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: enhancedPrompt,
      parameters: {
        guidance_scale: 7.5,
        num_inference_steps: 25,
        width: 1024,
        height: 1024
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }

  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  return `data:image/png;base64,${base64}`;
}