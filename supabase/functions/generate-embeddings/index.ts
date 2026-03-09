import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20;

/**
 * Generate an embedding vector from text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // Limit input to avoid token overflow
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Embeddings API error: ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Process a batch of items for embedding generation
 */
async function processBatch(
  table: string,
  textColumn: string,
  items: Array<{ id: string; text: string }>,
  jobId: string
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const embedding = await generateEmbedding(item.text);

      const updateData: Record<string, string> = {
        embedding: JSON.stringify(embedding),
      };
      // training_data uses embedding_updated_at; clara_conversation_memory uses updated_at
      if (table === 'training_data') {
        updateData.embedding_updated_at = new Date().toISOString();
      } else {
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', item.id);

      if (error) throw error;
      processed++;
    } catch (error) {
      console.error(`Failed to embed ${table} row ${item.id}:`, error);
      failed++;
    }

    // Update job progress
    if (jobId) {
      await supabase
        .from('clara_embedding_jobs')
        .update({
          processed_items: processed,
          failed_items: failed,
        })
        .eq('id', jobId);
    }

    // Rate limit: ~50ms between requests to stay under OpenAI limits
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { processed, failed };
}

interface EmbeddingRequest {
  mode: 'query' | 'single' | 'batch';
  // For query mode
  text?: string;
  // For single mode
  table?: string;
  id?: string;
  // For batch mode - table is reused
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EmbeddingRequest = await req.json();

    // ============================================================
    // QUERY MODE: Generate embedding for text, return vector
    // ============================================================
    if (body.mode === 'query') {
      if (!body.text) throw new Error('text is required for query mode');

      const embedding = await generateEmbedding(body.text);

      return new Response(
        JSON.stringify({ embedding }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // SINGLE MODE: Generate and store embedding for one row
    // ============================================================
    if (body.mode === 'single') {
      if (!body.table || !body.id) throw new Error('table and id required for single mode');

      const validTables = ['training_data', 'clara_conversation_memory'];
      if (!validTables.includes(body.table)) {
        throw new Error(`Invalid table: ${body.table}. Must be one of: ${validTables.join(', ')}`);
      }

      // Fetch the text content
      let textContent = '';
      if (body.table === 'training_data') {
        const { data, error } = await supabase
          .from('training_data')
          .select('question, answer')
          .eq('id', body.id)
          .single();
        if (error) throw error;
        textContent = `Q: ${data.question}\nA: ${data.answer}`;
      } else if (body.table === 'clara_conversation_memory') {
        const { data, error } = await supabase
          .from('clara_conversation_memory')
          .select('content')
          .eq('id', body.id)
          .single();
        if (error) throw error;
        textContent = data.content;
      }

      const embedding = await generateEmbedding(textContent);

      const { error: updateError } = await supabase
        .from(body.table)
        .update({
          embedding: JSON.stringify(embedding),
          ...(body.table === 'training_data' ? { embedding_updated_at: new Date().toISOString() } : { updated_at: new Date().toISOString() }),
        })
        .eq('id', body.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, embedding }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // BATCH MODE: Re-embed all un-embedded rows in a table
    // ============================================================
    if (body.mode === 'batch') {
      const table = body.table || 'training_data';
      const validTables = ['training_data', 'clara_conversation_memory'];
      if (!validTables.includes(table)) {
        throw new Error(`Invalid table: ${table}`);
      }

      // Count items needing embeddings
      let items: Array<{ id: string; text: string }> = [];

      if (table === 'training_data') {
        const { data, error } = await supabase
          .from('training_data')
          .select('id, question, answer')
          .is('embedding', null)
          .eq('status', 'active');
        if (error) throw error;
        items = (data || []).map(row => ({
          id: row.id,
          text: `Q: ${row.question}\nA: ${row.answer}`,
        }));
      } else if (table === 'clara_conversation_memory') {
        const { data, error } = await supabase
          .from('clara_conversation_memory')
          .select('id, content')
          .is('embedding', null);
        if (error) throw error;
        items = (data || []).map(row => ({
          id: row.id,
          text: row.content,
        }));
      }

      if (items.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No items need embedding', total: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create job record (map table name to valid job_type enum)
      const jobType = table === 'clara_conversation_memory' ? 'memory' : table;
      const { data: job, error: jobError } = await supabase
        .from('clara_embedding_jobs')
        .insert({
          job_type: jobType,
          total_items: items.length,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process in batches
      let totalProcessed = 0;
      let totalFailed = 0;

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const result = await processBatch(table, '', batch, job.id);
        totalProcessed += result.processed;
        totalFailed += result.failed;
      }

      // Mark job complete
      await supabase
        .from('clara_embedding_jobs')
        .update({
          processed_items: totalProcessed,
          failed_items: totalFailed,
          status: totalProcessed === 0 ? 'failed' : totalFailed > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          total: items.length,
          processed: totalProcessed,
          failed: totalFailed,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Invalid mode: ${body.mode}. Must be query, single, or batch.`);

  } catch (error) {
    console.error('Error in generate-embeddings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
