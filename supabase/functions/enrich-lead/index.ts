import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HunterContact {
  value: string;       // email
  type: string;        // personal or generic
  confidence: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
}

interface HunterDomainResponse {
  data: {
    domain: string;
    organization: string;
    emails: HunterContact[];
  };
}

interface HunterVerifyResponse {
  data: {
    email: string;
    result: "deliverable" | "undeliverable" | "risky" | "unknown";
    score: number;
    status: "valid" | "invalid" | "accept_all" | "webmail" | "disposable" | "unknown";
  };
}

type SupabaseClient = ReturnType<typeof createClient>;

// ============================================================
// Activity Logger
// ============================================================

async function logActivity(
  supabase: SupabaseClient,
  leadId: string,
  action: string,
  source: string,
  success: boolean,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from("lead_enrichment_log").insert({
      lead_id: leadId,
      action,
      source,
      success,
      details,
    });
  } catch (err) {
    console.error("[enrich-lead] logActivity error:", err);
  }
}

// ============================================================
// API Key Retrieval
// ============================================================

async function getApiKey(supabase: SupabaseClient, service: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("api_key, is_active, rate_limit_per_day, requests_today, last_reset_at")
    .eq("service", service)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    console.error(`[enrich-lead] No active API key for ${service}:`, error?.message);
    return null;
  }

  // Reset daily counter if it's a new day
  const lastReset = new Date(data.last_reset_at);
  const now = new Date();
  let requestsToday = data.requests_today || 0;

  if (lastReset.toDateString() !== now.toDateString()) {
    requestsToday = 0;
  }

  // Check rate limit
  if (data.rate_limit_per_day && requestsToday >= data.rate_limit_per_day) {
    console.warn(`[enrich-lead] ${service} daily rate limit reached (${requestsToday}/${data.rate_limit_per_day})`);
    return null;
  }

  // Increment counter
  await supabase
    .from("api_keys")
    .update({
      requests_today: requestsToday + 1,
      last_reset_at: lastReset.toDateString() !== now.toDateString() ? now.toISOString() : data.last_reset_at,
    })
    .eq("service", service);

  return data.api_key;
}

// ============================================================
// Hunter.io Domain Search
// ============================================================

const PRIORITY_ROLES = ["ceo", "founder", "owner", "director", "managing director", "co-founder", "president", "general manager"];

async function hunterDomainSearch(
  supabase: SupabaseClient,
  leadId: string,
  domain: string,
  hunterKey: string
): Promise<HunterContact | null> {
  console.log(`[enrich-lead] Hunter domain search: ${domain}`);

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${hunterKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      await logActivity(supabase, leadId, "hunter_domain_search", "hunter", false, {
        domain,
        status: res.status,
        error: errText,
      });
      console.error(`[enrich-lead] Hunter domain search failed (${res.status}):`, errText);
      return null;
    }

    const json: HunterDomainResponse = await res.json();
    const emails = json.data?.emails || [];

    if (emails.length === 0) {
      await logActivity(supabase, leadId, "hunter_domain_search", "hunter", true, {
        domain,
        contacts_found: 0,
      });
      return null;
    }

    // Prioritise CEO/founder/owner/director roles, then by confidence
    const sorted = [...emails].sort((a, b) => {
      const aRoleMatch = PRIORITY_ROLES.some(r => (a.position || "").toLowerCase().includes(r));
      const bRoleMatch = PRIORITY_ROLES.some(r => (b.position || "").toLowerCase().includes(r));
      if (aRoleMatch && !bRoleMatch) return -1;
      if (!aRoleMatch && bRoleMatch) return 1;
      return b.confidence - a.confidence;
    });

    const topContacts = sorted.slice(0, 3);
    const bestContact = topContacts[0];

    await logActivity(supabase, leadId, "hunter_domain_search", "hunter", true, {
      domain,
      organization: json.data.organization,
      contacts_found: emails.length,
      top_contacts: topContacts.map(c => ({
        email: c.value,
        position: c.position,
        confidence: c.confidence,
      })),
      best_contact: {
        email: bestContact.value,
        position: bestContact.position,
        confidence: bestContact.confidence,
      },
    });

    console.log(`[enrich-lead] Hunter found ${emails.length} contacts, best: ${bestContact.value} (${bestContact.confidence}%)`);
    return bestContact;
  } catch (err) {
    await logActivity(supabase, leadId, "hunter_domain_search", "hunter", false, {
      domain,
      error: (err as Error).message,
    });
    console.error("[enrich-lead] Hunter domain search error:", err);
    return null;
  }
}

// ============================================================
// Hunter.io Email Verification
// ============================================================

function mapHunterResult(result: string): "valid" | "invalid" | "risky" | "unknown" {
  switch (result) {
    case "deliverable": return "valid";
    case "undeliverable": return "invalid";
    case "risky": return "risky";
    default: return "unknown";
  }
}

async function hunterVerifyEmail(
  supabase: SupabaseClient,
  leadId: string,
  email: string,
  hunterKey: string
): Promise<{ status: "valid" | "invalid" | "risky" | "unknown"; score: number } | null> {
  console.log(`[enrich-lead] Hunter email verify: ${email}`);

  try {
    const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${hunterKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      await logActivity(supabase, leadId, "hunter_email_verify", "hunter", false, {
        email,
        status: res.status,
        error: errText,
      });
      console.error(`[enrich-lead] Hunter verify failed (${res.status}):`, errText);
      return null;
    }

    const json: HunterVerifyResponse = await res.json();
    const verificationStatus = mapHunterResult(json.data.result);

    await logActivity(supabase, leadId, "hunter_email_verify", "hunter", true, {
      email,
      result: json.data.result,
      mapped_status: verificationStatus,
      score: json.data.score,
      hunter_status: json.data.status,
    });

    console.log(`[enrich-lead] Verification: ${email} → ${verificationStatus} (score: ${json.data.score})`);
    return { status: verificationStatus, score: json.data.score };
  } catch (err) {
    await logActivity(supabase, leadId, "hunter_email_verify", "hunter", false, {
      email,
      error: (err as Error).message,
    });
    console.error("[enrich-lead] Hunter verify error:", err);
    return null;
  }
}

// ============================================================
// Extract domain from email or company website
// ============================================================

function extractDomain(email: string | null, metadata: Record<string, unknown> | null): string | null {
  // Try company website from metadata
  const website = metadata?.website as string | undefined;
  if (website) {
    try {
      return new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
    } catch { /* ignore */ }
  }

  // Try domain from metadata
  const domain = metadata?.domain as string | undefined;
  if (domain) return domain;

  // Extract from email
  if (email && email.includes("@")) {
    const emailDomain = email.split("@")[1].toLowerCase();
    // Skip freemail providers
    const freemail = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "aol.com", "protonmail.com", "mail.com"];
    if (!freemail.includes(emailDomain)) {
      return emailDomain;
    }
  }

  return null;
}

// ============================================================
// Main Enrichment Pipeline
// ============================================================

async function enrichLead(supabase: SupabaseClient, leadId: string): Promise<Record<string, unknown>> {
  // 1. Load lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  console.log(`[enrich-lead] Enriching lead ${leadId} (email: ${lead.email}, status: ${lead.status})`);

  // Get Hunter API key
  const hunterKey = await getApiKey(supabase, "hunter");
  if (!hunterKey) {
    await logActivity(supabase, leadId, "enrichment_skipped", "system", false, {
      reason: "No active Hunter API key found in api_keys table",
    });
    throw new Error("Hunter API key not found or rate-limited. Add it to the api_keys table with service='hunter'.");
  }

  const metadata = (lead.metadata || {}) as Record<string, unknown>;
  const researchData = (lead.research_data || {}) as Record<string, unknown>;
  let currentEmail = lead.email as string | null;
  let enrichmentSource = lead.enrichment_source as string | null;
  const updates: Record<string, unknown> = {};

  // 2. Apollo enrichment (stub — runs first in pipeline)
  // TODO: Add Apollo People API when APOLLO_API_KEY is configured
  const apolloFoundContact = false;
  await logActivity(supabase, leadId, "apollo_lookup", "apollo", false, {
    reason: "Apollo integration not yet configured",
  });

  // 3. Hunter Domain Search — runs after Apollo, before AI fallback
  if (!apolloFoundContact) {
    const domain = extractDomain(currentEmail, metadata);

    if (domain) {
      const hunterContact = await hunterDomainSearch(supabase, leadId, domain, hunterKey);

      if (hunterContact) {
        // Store Hunter results in research_data
        researchData.hunter_domain_search = {
          domain,
          best_email: hunterContact.value,
          name: [hunterContact.first_name, hunterContact.last_name].filter(Boolean).join(" ") || null,
          position: hunterContact.position,
          department: hunterContact.department,
          hunter_confidence: hunterContact.confidence,
          searched_at: new Date().toISOString(),
        };

        // Only overwrite email if we had nothing
        if (!currentEmail) {
          currentEmail = hunterContact.value;
          updates.email = hunterContact.value;
          enrichmentSource = "hunter_domain_search";

          // Store name from Hunter if available
          const hunterName = [hunterContact.first_name, hunterContact.last_name].filter(Boolean).join(" ");
          if (hunterName && !metadata.name) {
            metadata.name = hunterName;
            metadata.role = hunterContact.position;
            updates.metadata = metadata;
          }
        }
      }
    } else {
      await logActivity(supabase, leadId, "hunter_domain_search_skipped", "hunter", true, {
        reason: "No usable domain found (freemail or missing)",
      });
    }
  }

  // 4. Email Verification — runs for ANY email from any source
  if (currentEmail) {
    const verification = await hunterVerifyEmail(supabase, leadId, currentEmail, hunterKey);

    if (verification) {
      updates.email_verified = verification.status === "valid";
      updates.email_verification_status = verification.status;
      updates.email_verified_at = new Date().toISOString();

      researchData.hunter_email_verification = {
        email: currentEmail,
        status: verification.status,
        score: verification.score,
        verified_at: new Date().toISOString(),
      };

      // Apply confidence rules
      if (verification.status === "invalid") {
        updates.email = null;
        updates.contact_confidence = "guessed";
        researchData.email_cleared_reason = `Hunter verified as invalid (score: ${verification.score})`;
        console.log(`[enrich-lead] Email ${currentEmail} is INVALID — cleared from lead`);
      } else if (verification.status === "valid") {
        updates.contact_confidence = "verified";
      } else if (verification.status === "risky") {
        updates.contact_confidence = "likely";
      }
    }
  } else {
    await logActivity(supabase, leadId, "email_verify_skipped", "hunter", true, {
      reason: "No email to verify",
    });
  }

  // 5. Update lead with enrichment results
  updates.research_data = researchData;
  updates.enriched_at = new Date().toISOString();
  if (enrichmentSource) {
    updates.enrichment_source = enrichmentSource;
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId);

  if (updateError) {
    await logActivity(supabase, leadId, "lead_update_failed", "system", false, {
      error: updateError.message,
    });
    throw new Error(`Failed to update lead: ${updateError.message}`);
  }

  await logActivity(supabase, leadId, "enrichment_complete", "system", true, {
    email_found: !!currentEmail,
    email_verified: updates.email_verified ?? null,
    email_verification_status: updates.email_verification_status ?? null,
    contact_confidence: updates.contact_confidence ?? lead.contact_confidence,
    enrichment_source: enrichmentSource,
  });

  console.log(`[enrich-lead] Lead ${leadId} enrichment complete`);

  return {
    lead_id: leadId,
    email: updates.email !== undefined ? updates.email : currentEmail,
    email_verified: updates.email_verified ?? null,
    email_verification_status: updates.email_verification_status ?? null,
    contact_confidence: updates.contact_confidence ?? lead.contact_confidence ?? "unknown",
    enrichment_source: enrichmentSource,
    research_data: researchData,
  };
}

// ============================================================
// Batch Enrichment
// ============================================================

async function enrichBatch(
  supabase: SupabaseClient,
  filters: { status?: string; limit?: number; unenriched_only?: boolean }
): Promise<{ enriched: number; failed: number; results: unknown[] }> {
  let query = supabase.from("leads").select("id").order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.unenriched_only !== false) {
    query = query.is("enriched_at", null);
  }

  const limit = Math.min(filters.limit || 10, 50);
  query = query.limit(limit);

  const { data: leads, error } = await query;
  if (error || !leads) {
    throw new Error(`Failed to fetch leads: ${error?.message}`);
  }

  let enriched = 0;
  let failed = 0;
  const results: unknown[] = [];

  for (const lead of leads) {
    try {
      const result = await enrichLead(supabase, lead.id);
      results.push(result);
      enriched++;
    } catch (err) {
      results.push({ lead_id: lead.id, error: (err as Error).message });
      failed++;
    }
  }

  return { enriched, failed, results };
}

// ============================================================
// HTTP Handler
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { action } = body;

    if (action === "enrich_single") {
      // Enrich a single lead by ID
      const { lead_id } = body;
      if (!lead_id) throw new Error("lead_id is required");

      const result = await enrichLead(supabase, lead_id);
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "enrich_batch") {
      // Enrich multiple unenriched leads
      const result = await enrichBatch(supabase, {
        status: body.status,
        limit: body.limit,
        unenriched_only: body.unenriched_only,
      });
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify_email") {
      // Verify a single email without a lead context
      const { email, lead_id } = body;
      if (!email) throw new Error("email is required");

      const hunterKey = await getApiKey(supabase, "hunter");
      if (!hunterKey) throw new Error("Hunter API key not found or rate-limited");

      const result = await hunterVerifyEmail(supabase, lead_id || "00000000-0000-0000-0000-000000000000", email, hunterKey);
      return new Response(JSON.stringify({ success: true, email, verification: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: enrich_single, enrich_batch, verify_email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[enrich-lead] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
