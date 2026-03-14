/**
 * gift-send-email
 * Sends gift delivery email to recipient + buyer confirmation email.
 * Called after Stripe payment succeeds (from stripe-webhook) or by gift-delivery-check cron.
 *
 * Input: { gift_id: string, type: 'recipient' | 'buyer' | 'both' }
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GIFT-SEND-EMAIL] ${step}${detailsStr}`);
};

const GIFT_TYPE_LABELS: Record<string, { en: string; months: number }> = {
  monthly: { en: "1 Month LifeLink Sync", months: 1 },
  annual: { en: "12 Months LifeLink Sync", months: 12 },
  bundle: { en: "12 Months LifeLink Sync + ICE SOS Pendant", months: 12 },
  voucher: { en: "LifeLink Sync Gift Voucher", months: 12 },
};

// ── Recipient gift delivery email ─────────────────────────────────
function buildRecipientEmailHtml(gift: {
  purchaser_name: string;
  recipient_name: string;
  gift_type: string;
  personal_message: string | null;
  redeem_code: string;
  expires_at: string;
  amount_paid: number;
}): string {
  const label = GIFT_TYPE_LABELS[gift.gift_type] ?? { en: "LifeLink Sync Gift", months: 1 };
  const redeemUrl = `https://lifelink-sync.com/gift/redeem/${gift.redeem_code}`;
  const expiryDate = new Date(gift.expires_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const messageBlock = gift.personal_message
    ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="color: #92400e; font-size: 13px; margin: 0 0 4px; font-weight: 600;">A personal message from ${gift.purchaser_name}:</p>
      <p style="color: #78350f; font-size: 15px; margin: 0; font-style: italic;">&ldquo;${gift.personal_message}&rdquo;</p>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #f3f4f6;">

<div style="text-align: center; padding: 32px 20px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 0 0 0 0;">
  <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: -0.5px;">LifeLink Sync</h1>
  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Emergency Protection Platform</p>
</div>

<div style="background: #fff; padding: 32px 28px; border: 1px solid #e5e7eb; border-top: none;">

  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 48px; margin-bottom: 8px;">🎁</div>
    <h2 style="color: #111; margin: 0 0 8px; font-size: 22px;">You've Been Gifted LifeLink Sync</h2>
    <p style="color: #6b7280; margin: 0; font-size: 15px;">${gift.purchaser_name} wants to make sure you're always protected</p>
  </div>

  ${messageBlock}

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="color: #111; margin: 0 0 12px; font-size: 15px;">What you get:</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; font-size: 14px; color: #374151;">&#10003; 24/7 CLARA AI protection</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #374151;">&#10003; One-touch SOS emergency button</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #374151;">&#10003; Live location sharing with family</td></tr>
      <tr><td style="padding: 6px 0; font-size: 14px; color: #374151;">&#10003; ${label.months} month${label.months > 1 ? "s" : ""} fully covered</td></tr>
    </table>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${redeemUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Activate Your Gift &rarr;</a>
  </div>

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; text-align: center; margin: 24px 0;">
    <p style="color: #166534; font-size: 13px; margin: 0 0 4px;">Your redemption code:</p>
    <p style="color: #166534; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 2px; font-family: 'Courier New', monospace;">${gift.redeem_code}</p>
  </div>

  <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 24px 0 0;">
    No credit card needed. Your gift is already paid for.
  </p>
</div>

<div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
  <p style="margin: 0 0 4px;">Gift expires ${expiryDate}.</p>
  <p style="margin: 0;">Questions? <a href="mailto:support@lifelink-sync.com" style="color: #ef4444;">support@lifelink-sync.com</a></p>
  <p style="margin: 12px 0 0; color: #d1d5db;">LifeLink Sync &mdash; Always There. Always Ready.</p>
</div>

</body>
</html>`;
}

// ── Buyer confirmation email ──────────────────────────────────────
function buildBuyerEmailHtml(gift: {
  purchaser_name: string;
  recipient_name: string;
  recipient_email: string;
  gift_type: string;
  amount_paid: number;
  currency: string;
  redeem_code: string;
  delivery_date: string | null;
  delivered_at: string | null;
  id: string;
}): string {
  const label = GIFT_TYPE_LABELS[gift.gift_type] ?? { en: "LifeLink Sync Gift", months: 1 };
  const price = `€${Number(gift.amount_paid).toFixed(2)}`;
  const trackUrl = `https://lifelink-sync.com/gift/confirmation?id=${gift.id}`;

  const deliveryInfo = gift.delivery_date && !gift.delivered_at
    ? `<p style="color: #374151; font-size: 14px;"><strong>Scheduled delivery:</strong> ${new Date(gift.delivery_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>`
    : `<p style="color: #374151; font-size: 14px;"><strong>Delivered:</strong> Sent immediately to ${gift.recipient_email}</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #f3f4f6;">

<div style="text-align: center; padding: 32px 20px; background: linear-gradient(135deg, #ef4444, #dc2626);">
  <h1 style="color: white; margin: 0; font-size: 26px;">LifeLink Sync</h1>
  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Gift Confirmation</p>
</div>

<div style="background: #fff; padding: 32px 28px; border: 1px solid #e5e7eb; border-top: none;">

  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 40px; margin-bottom: 8px;">&#127873;</div>
    <h2 style="color: #111; margin: 0 0 8px; font-size: 20px;">Your Gift for ${gift.recipient_name} is Confirmed!</h2>
  </div>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #111; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Package:</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111; font-weight: 600; text-align: right;">${label.en}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Recipient:</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111; text-align: right;">${gift.recipient_name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Amount paid:</td>
        <td style="padding: 8px 0; font-size: 14px; color: #111; font-weight: 600; text-align: right;">${price}</td>
      </tr>
    </table>
    ${deliveryInfo}
  </div>

  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; text-align: center; margin: 20px 0;">
    <p style="color: #1e40af; font-size: 13px; margin: 0 0 4px;">Redemption code (in case you want to share it yourself):</p>
    <p style="color: #1e40af; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 2px; font-family: 'Courier New', monospace;">${gift.redeem_code}</p>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="${trackUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Track Your Gift</a>
  </div>
</div>

<div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
  <p style="margin: 0;">Thank you for giving the gift of safety.</p>
  <p style="margin: 8px 0 0; color: #d1d5db;">LifeLink Sync &mdash; Always There. Always Ready.</p>
</div>

</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { gift_id, type = "both" } = await req.json();
    if (!gift_id) throw new Error("gift_id is required");

    logStep("Processing", { gift_id, type });

    // Fetch gift details
    const { data: gift, error: giftError } = await supabase
      .from("gift_subscriptions")
      .select("*")
      .eq("id", gift_id)
      .single();

    if (giftError || !gift) {
      throw new Error(`Gift not found: ${giftError?.message ?? "no data"}`);
    }

    logStep("Gift loaded", { gift_type: gift.gift_type, status: gift.status, recipient: gift.recipient_email });

    if (!resendApiKey) {
      logStep("RESEND_API_KEY not set — skipping emails");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_resend_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { recipient?: boolean; buyer?: boolean } = {};

    // Send recipient email
    if (type === "recipient" || type === "both") {
      try {
        const recipientHtml = buildRecipientEmailHtml({
          purchaser_name: gift.purchaser_name || "Someone special",
          recipient_name: gift.recipient_name || "Friend",
          gift_type: gift.gift_type,
          personal_message: gift.personal_message,
          redeem_code: gift.redeem_code,
          expires_at: gift.expires_at,
          amount_paid: gift.amount_paid,
        });

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "CLARA from LifeLink Sync <clara@lifelink-sync.com>",
            to: [gift.recipient_email],
            subject: `${gift.purchaser_name || "Someone special"} has given you the gift of safety with LifeLink Sync`,
            html: recipientHtml,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          logStep("Recipient email failed", { status: res.status, error: err });
          results.recipient = false;
        } else {
          const emailData = await res.json();
          logStep("Recipient email sent", { emailId: emailData.id });
          results.recipient = true;

          // Update gift status to delivered
          await supabase
            .from("gift_subscriptions")
            .update({ status: "delivered", delivered_at: new Date().toISOString() })
            .eq("id", gift_id);

          // Log to email_logs
          await supabase.from("email_logs").insert({
            user_id: gift.purchaser_user_id,
            recipient_email: gift.recipient_email,
            subject: `Gift delivery: ${gift.gift_type} to ${gift.recipient_name}`,
            email_type: "gift_delivery",
            status: "sent",
            provider_message_id: emailData.id,
          });
        }
      } catch (err) {
        logStep("Recipient email error", { error: String(err) });
        results.recipient = false;
      }
    }

    // Send buyer confirmation email
    if (type === "buyer" || type === "both") {
      try {
        const buyerHtml = buildBuyerEmailHtml({
          purchaser_name: gift.purchaser_name || "Friend",
          recipient_name: gift.recipient_name || "Recipient",
          recipient_email: gift.recipient_email,
          gift_type: gift.gift_type,
          amount_paid: gift.amount_paid,
          currency: gift.currency,
          redeem_code: gift.redeem_code,
          delivery_date: gift.delivery_date,
          delivered_at: gift.delivered_at,
          id: gift.id,
        });

        const purchaserEmail = gift.purchaser_email || (
          gift.purchaser_user_id
            ? (await supabase.auth.admin.getUserById(gift.purchaser_user_id)).data?.user?.email
            : null
        );

        if (!purchaserEmail) {
          logStep("No purchaser email — skipping buyer confirmation");
          results.buyer = false;
        } else {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "LifeLink Sync <noreply@lifelink-sync.com>",
              to: [purchaserEmail],
              subject: `Your gift for ${gift.recipient_name || "your loved one"} is confirmed`,
              html: buyerHtml,
            }),
          });

          if (!res.ok) {
            const err = await res.text();
            logStep("Buyer email failed", { status: res.status, error: err });
            results.buyer = false;
          } else {
            const emailData = await res.json();
            logStep("Buyer email sent", { emailId: emailData.id });
            results.buyer = true;

            await supabase.from("email_logs").insert({
              user_id: gift.purchaser_user_id,
              recipient_email: purchaserEmail,
              subject: `Gift confirmation: ${gift.gift_type} for ${gift.recipient_name}`,
              email_type: "gift_buyer_confirmation",
              status: "sent",
              provider_message_id: emailData.id,
            });
          }
        }
      } catch (err) {
        logStep("Buyer email error", { error: String(err) });
        results.buyer = false;
      }
    }

    logStep("Complete", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
