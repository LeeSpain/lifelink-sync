import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Currency conversion rates (simplified for demo)
const CURRENCY_RATES = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.85,
  AUD: 1.63,
};

const convertPrice = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  const amountInEUR = amount / (CURRENCY_RATES[fromCurrency as keyof typeof CURRENCY_RATES] || 1);
  return amountInEUR * (CURRENCY_RATES[toCurrency as keyof typeof CURRENCY_RATES] || 1);
};

const formatCurrency = (amount: number, currency: string, language: string): string => {
  const locale = language === 'es' ? 'es-ES' : language === 'nl' ? 'nl-NL' : 'en-US';
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
};

const getKnowledgeBase = (language: string = 'en', currency: string = 'EUR') => {
  // Updated customer-facing pricing
  const memberPrice = convertPrice(9.99, 'EUR', currency);
  const familyPrice = convertPrice(2.99, 'EUR', currency);
  const formattedMember = formatCurrency(memberPrice, currency, language);
  const formattedFamily = formatCurrency(familyPrice, currency, language);

  const knowledgeBases = {
    en: `
You are Clara, the friendly customer-facing AI assistant for LifeLink Sync.

STRICT SAFETY AND PRIVACY GUARDRAILS (must always follow):
- Never disclose or discuss anything internal, admin-only, backend, infrastructure, or company-confidential (e.g., admin dashboard, databases, APIs/keys, architecture, internal processes).
- If asked for internal info, politely refuse: "I'm here to help with customer information. I can't share internal or admin details, but I can help with features, pricing, setup, and support."
- Focus only on public, customer-friendly information.

What LifeLink Sync is:
- Personal emergency protection with privacy-first design
- 24/7 emergency monitoring and notifications to family contacts
- Works with our mobile app, Bluetooth emergency pendant, and compatible smartwatches

Pricing (quoted in ${currency}):
- Member Plan: ${formattedMember}/month — full emergency features, device support, GPS, 24/7 monitoring, priority support
- Family Access: ${formattedFamily}/month — for family members to receive alerts and stay connected

Key Features:
- SOS emergency alerts with SMS, email, and automated calls
- GPS location sharing during emergencies
- Family notifications and check-ins (privacy-controlled)
- Bluetooth pendant: waterproof, up to 6 months battery, one-button SOS
- Multi-language support (English, Spanish, Dutch, etc.)

Style:
- Warm, clear, empathetic, and concise
- Ask clarifying questions when needed and offer next steps
- Always end with an offer to help further (e.g., "Would you like help getting started?")`,

    es: `
Eres Clara, la asistente de IA para clientes de LifeLink Sync.

REGLAS ESTRICTAS DE SEGURIDAD Y PRIVACIDAD:
- Nunca compartas información interna, solo para administradores, backend, infraestructura o confidencial de la empresa (p.ej., panel de admin, bases de datos, APIs/keys, arquitectura).
- Si te piden datos internos, rechaza amablemente: "Puedo ayudarte con información para clientes. No puedo compartir detalles internos o de administración, pero sí con funciones, precios, configuración y soporte."
- Enfócate únicamente en información pública para clientes.

Qué es LifeLink Sync:
- Protección personal de emergencias con diseño de privacidad primero
- Monitoreo de emergencias 24/7 y notificaciones a familiares
- Funciona con nuestra app móvil, colgante Bluetooth y relojes inteligentes compatibles

Precios (en ${currency}):
- Plan Miembro: ${formattedMember}/mes — funciones completas, soporte de dispositivos, GPS, monitoreo 24/7, soporte prioritario
- Acceso Familiar: ${formattedFamily}/mes — para que familiares reciban alertas y estén conectados

Funciones Clave:
- Alertas SOS por SMS, email y llamadas automáticas
- Compartir ubicación por GPS en emergencias
- Notificaciones familiares y check-ins (controlados por privacidad)
- Colgante Bluetooth: resistente al agua, batería hasta 6 meses, botón SOS
- Soporte multilenguaje (inglés, español, neerlandés, etc.)

Estilo:
- Cálido, claro, empático y conciso
- Haz preguntas aclaratorias y ofrece próximos pasos
- Termina ofreciendo más ayuda (p.ej., "¿Quieres que te ayude a empezar?")`,

    nl: `
Je bent Clara, de klantgerichte AI-assistent voor LifeLink Sync.

STRIKTE VEILIGHEIDS- EN PRIVACYREGELS:
- Deel nooit interne, alleen-voor-admin, backend-, infrastructuur- of bedrijfsgevoelige info (zoals admin dashboard, databases, API's/keys, architectuur).
- Als iemand daarnaar vraagt, weiger vriendelijk: "Ik help met klantinformatie. Interne of admin-details kan ik niet delen, maar ik help graag met functies, prijzen, setup en support."
- Focus uitsluitend op publieke, klantvriendelijke informatie.

Wat LifeLink Sync is:
- Persoonlijke noodbescherming met privacy-first ontwerp
- 24/7 noodbewaking en meldingen naar familiecontacten
- Werkt met onze mobiele app, Bluetooth-hanger en compatibele smartwatches

Prijzen (in ${currency}):
- Lidmaatschap: ${formattedMember}/maand — volledige noodfuncties, apparaatondersteuning, GPS, 24/7 monitoring, priority support
- Familie Toegang: ${formattedFamily}/maand — voor familieleden om meldingen te ontvangen en verbonden te blijven

Belangrijkste functies:
- SOS-noodmeldingen via SMS, e-mail en automatische oproepen
- GPS-locatie delen tijdens noodgevallen
- Familieberichten en check-ins (privacygestuurd)
- Bluetooth-hanger: waterdicht, tot 6 maanden batterij, éénknops SOS
- Meertalige ondersteuning (EN, ES, NL, enz.)

Stijl:
- Warm, duidelijk, empathisch en bondig
- Stel verduidelijkende vragen en bied vervolgstappen aan
- Eindig altijd met een hulpaanbod (bijv. "Wil je dat ik je op weg help?")`,
  };

  return knowledgeBases[language as keyof typeof knowledgeBases] || knowledgeBases.en;
};

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: string;
  conversation_history?: any[];
  language?: 'en' | 'es' | 'nl';
  currency?: 'EUR' | 'USD' | 'GBP' | 'AUD';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId, context, language = 'en', currency = 'EUR' }: ChatRequest = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || crypto.randomUUID();

    // Get conversation history for context
    const { data: conversationHistory } = await supabase
      .from('conversations')
      .select('message_type, content, created_at')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Store user message with enhanced metadata
    await supabase
      .from('conversations')
      .insert({
        user_id: userId || null,
        session_id: currentSessionId,
        message_type: 'user',
        content: message,
        metadata: {
          context: context || 'general',
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || null,
          language,
          currency,
          source_page: context?.includes('homepage') ? 'homepage' : 
                      context?.includes('registration') ? 'registration' : 'general'
        }
      });

    // Get active customer-facing training data for enhanced knowledge
    const { data: trainingData } = await supabase
      .from('training_data')
      .select('question, answer, category')
      .eq('status', 'active')
      .eq('audience', 'customer')
      .order('confidence_score', { ascending: false })
      .limit(50);

    // Get language and currency-specific knowledge base
    const knowledgeBase = getKnowledgeBase(language, currency);

    // Build enhanced knowledge base
    let enhancedKnowledge = knowledgeBase;
    
    if (trainingData && trainingData.length > 0) {
      const trainingContent = trainingData.map(item => 
        `Q: ${item.question}\nA: ${item.answer}`
      ).join('\n\n');
      
      enhancedKnowledge += `\n\nADDITIONAL TRAINING DATA:\n${trainingContent}\n\nUse this training data to provide more accurate and detailed responses when relevant.`;
    }

    // Build conversation context
    const conversationContext = conversationHistory?.map(msg => ({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })) || [];

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: enhancedKnowledge
      },
      ...conversationContext,
      {
        role: 'user',
        content: message
      }
    ];

    // Get Clara's AI settings from database
    const { data: aiSettings } = await supabase
      .from('ai_model_settings')
      .select('setting_key, setting_value');
    
    // Parse settings with defaults
    const settings = aiSettings?.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as any) || {};
    
    const temperature = Number(settings.temperature) || 0.7;
    const maxTokens = Number(settings.max_tokens) || 500;
    const model = settings.model || 'gpt-4o-mini';
    
    // If custom system prompt exists, replace the enhanced knowledge with it
    if (settings.system_prompt && typeof settings.system_prompt === 'string') {
      messages[0].content = settings.system_prompt;
    }

    // Call OpenAI with dynamic settings
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content as string;

    // Post-filter to prevent internal/admin leakage
    const forbiddenPatterns = [
      /\badmin\b/i,
      /backend/i,
      /database/i,
      /server key/i,
      /service role/i,
      /supabase service/i,
      /jwt/i,
      /edge function secret/i,
      /api key/i,
      /infrastructure/i
    ];

    const sanitized = forbiddenPatterns.some((re) => re.test(aiResponse))
      ? "I'm here to help with customer information. I can't share internal or admin details, but I can help with features, pricing, setup, and support."
      : aiResponse;

    // Store AI response
    await supabase
      .from('conversations')
      .insert({
        user_id: userId || null,
        session_id: currentSessionId,
        message_type: 'ai',
        content: sanitized
      });

    // Update usage statistics for training data that might have been used
    if (trainingData && trainingData.length > 0) {
      // Simple keyword matching to identify which training data was likely used
      const usedTrainingItems = trainingData.filter(item => 
        aiResponse.toLowerCase().includes(item.answer.toLowerCase().slice(0, 20)) ||
        message.toLowerCase().includes(item.question.toLowerCase().slice(0, 20))
      );

      for (const item of usedTrainingItems) {
        await supabase
          .from('training_data')
          .update({
            usage_count: item.usage_count ? item.usage_count + 1 : 1,
            last_used_at: new Date().toISOString()
          })
          .eq('question', item.question)
          .eq('answer', item.answer);
      }
    }

    // Analyze conversation for lead scoring
    const isShowingInterest = /\b(interested|price|cost|sign up|subscribe|family|emergency|elderly|relative|parent|protection|safety)\b/i.test(message);
    const isAskingQuestions = message.includes('?');
    
    if (isShowingInterest || isAskingQuestions) {
      // Update or create lead
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('session_id', currentSessionId)
        .single();

      if (existingLead) {
        // Update existing lead
        await supabase
          .from('leads')
          .update({
            interest_level: Math.min(existingLead.interest_level + 1, 10),
            updated_at: new Date().toISOString()
          })
          .eq('session_id', currentSessionId);
      } else {
        // Create new lead
        await supabase
          .from('leads')
          .insert({
            session_id: currentSessionId,
            user_id: userId || null,
            interest_level: isShowingInterest ? 3 : 1,
            metadata: { first_message: message }
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        response: sanitized, 
        sessionId: currentSessionId 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});