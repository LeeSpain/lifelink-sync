-- Add image model selection to riven_settings
ALTER TABLE public.riven_settings
  ADD COLUMN IF NOT EXISTS image_model TEXT NOT NULL DEFAULT 'gemini'
    CHECK (image_model IN ('gemini', 'dalle3', 'flux')),
  ADD COLUMN IF NOT EXISTS image_quality TEXT NOT NULL DEFAULT 'standard'
    CHECK (image_quality IN ('standard', 'high')),
  ADD COLUMN IF NOT EXISTS image_style TEXT NOT NULL DEFAULT 'natural'
    CHECK (image_style IN ('natural', 'vivid'));

-- Set existing rows to gemini default
UPDATE public.riven_settings SET image_model = 'gemini' WHERE image_model = 'gemini';

-- Image generation config in ai_model_settings
INSERT INTO public.ai_model_settings (setting_key, setting_value, description)
VALUES (
  'image_generation_config',
  '{
    "default_model": "gemini",
    "models": {
      "gemini": {
        "name": "Gemini Imagen 3",
        "provider": "google",
        "cost_per_image": 0,
        "cost_label": "Free",
        "enabled": true
      },
      "dalle3": {
        "name": "DALL-E 3",
        "provider": "openai",
        "cost_per_image": 0.04,
        "cost_label": "~€0.04/image",
        "enabled": true
      },
      "flux": {
        "name": "Flux 1.1 Pro",
        "provider": "replicate",
        "cost_per_image": 0.003,
        "cost_label": "~€0.003/image",
        "enabled": false
      }
    }
  }',
  'Riven image generation model configuration'
)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Create storage bucket for marketing assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-assets', 'marketing-assets', true)
ON CONFLICT (id) DO NOTHING;
