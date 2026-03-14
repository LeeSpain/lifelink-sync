/**
 * stripe-webhook
 * Auth: webhook signature validation
 * Updates billing_status on family memberships based on Stripe events
 * Pauses location visibility when billing is past due for privacy protection
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.slice(2);
  const expectedSig = signaturePart.slice(3);

  // Reject events older than 5 minutes to prevent replay attacks
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (isNaN(age) || age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );
  const computedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (computedSig.length !== expectedSig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computedSig.length; i++) {
    mismatch |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.text();

    // Verify Stripe webhook signature - reject if secret is configured but verification fails
    if (STRIPE_WEBHOOK_SECRET) {
      const sigHeader = req.headers.get("stripe-signature");
      if (!sigHeader || !(await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET))) {
        console.error("Invalid Stripe webhook signature");
        return new Response("Invalid signature", { status: 400 });
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const event = JSON.parse(body);
    console.log("💳 Processing Stripe webhook:", event.type);

    // Extract user_id from metadata - could be owner_user_id for subscriptions or user_id for orders
    const ownerUserId = event?.data?.object?.metadata?.owner_user_id;
    const userId = event?.data?.object?.metadata?.user_id;
    
    // For one-time payments (checkout.session.completed), we don't require owner_user_id
    if (!ownerUserId && !userId && event.type !== "checkout.session.completed") {
      console.log("ℹ️ No user metadata found, skipping");
      return new Response(JSON.stringify({ 
        received: true, 
        note: "No user metadata found" 
      }), {
        headers: { "content-type": "application/json" }
      });
    }

    console.log("👤 Processing for owner_user_id:", ownerUserId);

    // Handle successful payment events
    if (event.type === "invoice.payment_succeeded" || 
        event.type === "customer.subscription.resumed" ||
        event.type === "checkout.session.completed") {
      
      console.log("✅ Payment successful - activating billing status");
      
      // For one-time payments, update orders to completed and fix payment intent mapping
      if (event.type === "checkout.session.completed") {
        const session = event?.data?.object;
        const paymentIntent = session?.payment_intent;
        const checkoutUserId = session?.metadata?.user_id;

        if (paymentIntent && checkoutUserId) {
          const { error: orderError } = await supabase
            .from("orders")
            .update({ status: "completed" })
            .eq("stripe_payment_intent_id", String(paymentIntent))
            .eq("user_id", checkoutUserId);

          if (orderError) {
            console.error("❌ Error updating order status:", orderError);
          } else {
            console.log("✅ Order marked as completed");
          }
        } else {
          console.warn("⚠️ Missing payment_intent or user metadata on checkout.session.completed");
        }
      }

      // Upsert subscriber record on successful payment-related events
      try {
        const obj = event?.data?.object;
        const customerId = obj?.customer;
        const customerEmail = obj?.customer_email || obj?.customer_details?.email;
        const subTier =
          obj?.metadata?.subscription_tier ||
          obj?.lines?.data?.[0]?.price?.nickname ||
          obj?.metadata?.tier ||
          "premium";
        const periodEndUnix = obj?.lines?.data?.[0]?.period?.end;
        const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;
        const subscriberUserId = ownerUserId || userId || obj?.metadata?.user_id || null;

        if (subscriberUserId || customerEmail) {
          const updatePayload: any = {
            subscribed: true,
            subscription_tier: String(subTier),
            stripe_customer_id: customerId ? String(customerId) : null,
            subscription_end: periodEnd,
            updated_at: new Date().toISOString(),
          };

          let updated = 0;
          if (subscriberUserId) {
            const { data: u1, error: e1 } = await supabase
              .from("subscribers")
              .update(updatePayload)
              .eq("user_id", subscriberUserId)
              .select("id");
            if (e1) console.error("❌ subscribers update by user_id error:", e1);
            updated = (u1?.length ?? 0);
          }
          if (updated === 0 && customerEmail) {
            const { data: u2, error: e2 } = await supabase
              .from("subscribers")
              .update(updatePayload)
              .eq("email", customerEmail)
              .select("id");
            if (e2) console.error("❌ subscribers update by email error:", e2);
            updated = (u2?.length ?? 0);
          }
          if (updated === 0) {
            const insertPayload: any = {
              user_id: subscriberUserId,
              email: customerEmail ?? null,
              subscribed: true,
              subscription_tier: String(subTier),
              stripe_customer_id: customerId ? String(customerId) : null,
              subscription_end: periodEnd,
            };
            const { error: insErr } = await supabase.from("subscribers").insert([insertPayload]);
            if (insErr) {
              console.error("❌ subscribers insert error:", insErr);
            } else {
              console.log("✅ Subscriber upserted/inserted");
            }
          } else {
            console.log("✅ Subscriber updated");
          }
        } else {
          console.log("ℹ️ No subscriber identifiers (user_id/email) present in event to upsert");
        }
      } catch (subErr) {
        console.error("❌ Error upserting subscriber:", subErr);
      }
      
      // Update subscription billing status if this is subscription-related
      if (ownerUserId) {
        const { error: updateError } = await supabase
          .from("family_memberships")
          .update({ billing_status: "active" })
          .eq("user_id", ownerUserId);

        if (updateError) {
          console.error("❌ Error updating billing status to active:", updateError);
        } else {
          console.log("✅ Billing status updated to active");
        }

        // Re-enable location sharing for all family members
        const { error: presenceError } = await supabase
          .from("live_presence")
          .update({ is_paused: false })
          .in("user_id", [ownerUserId]);

        if (presenceError) {
          console.error("❌ Error resuming location sharing:", presenceError);
        } else {
          console.log("📍 Location sharing resumed");
        }
      }
    }

    // Handle failed payment events
    if (event.type === "invoice.payment_failed" || 
        event.type === "customer.subscription.paused" ||
        event.type === "customer.subscription.canceled") {
      
      console.log("❌ Payment failed - updating billing status");
      
      // Update billing status to past_due
      const { error: updateError } = await supabase
        .from("family_memberships")
        .update({ billing_status: "past_due" })
        .eq("user_id", ownerUserId);

      if (updateError) {
        console.error("❌ Error updating billing status to past_due:", updateError);
      } else {
        console.log("⚠️ Billing status updated to past_due");
      }

      // Pause location sharing for privacy protection
      const { error: presenceError } = await supabase
        .from("live_presence")
        .update({ is_paused: true })
        .in("user_id", [ownerUserId]); // Could expand to all family members

      if (presenceError) {
        console.error("❌ Error pausing location sharing:", presenceError);
      } else {
        console.log("⏸️ Location sharing paused for privacy");
      }

      // Mark subscriber as inactive on failed/paused/canceled
      try {
        const obj = event?.data?.object;
        const customerId = obj?.customer;
        const customerEmail = obj?.customer_email || obj?.customer_details?.email;
        let updated = 0;
        if (ownerUserId) {
          const { data: u1, error: e1 } = await supabase
            .from("subscribers")
            .update({ subscribed: false, updated_at: new Date().toISOString() })
            .eq("user_id", ownerUserId)
            .select("id");
          if (e1) console.error("❌ subscribers deactivate by user_id error:", e1);
          updated = (u1?.length ?? 0);
        }
        if (updated === 0 && customerEmail) {
          const { data: u2, error: e2 } = await supabase
            .from("subscribers")
            .update({ subscribed: false, updated_at: new Date().toISOString() })
            .eq("email", customerEmail)
            .select("id");
          if (e2) console.error("❌ subscribers deactivate by email error:", e2);
          updated = (u2?.length ?? 0);
        }
        if (updated === 0 && customerId) {
          const { data: u3, error: e3 } = await supabase
            .from("subscribers")
            .update({ subscribed: false, updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", String(customerId))
            .select("id");
          if (e3) console.error("❌ subscribers deactivate by customer_id error:", e3);
        }
        console.log("✅ Subscriber set to inactive");
      } catch (subErr) {
        console.error("❌ Error deactivating subscriber:", subErr);
      }
    }

    // Handle grace period events
    if (event.type === "invoice.payment_action_required") {
      console.log("⏳ Payment action required - setting grace period");
      
      const { error: updateError } = await supabase
        .from("family_memberships")
        .update({ billing_status: "grace" })
        .eq("user_id", ownerUserId);

      if (updateError) {
        console.error("❌ Error updating billing status to grace:", updateError);
      } else {
        console.log("⏳ Billing status updated to grace period");
      }
    }

    // Handle add-on checkout completion
    if (event.type === "checkout.session.completed") {
      const session = event?.data?.object;
      const addonSlugs = session?.metadata?.addon_slugs;
      const checkoutUserId = session?.metadata?.user_id;
      const stripeSubscriptionId = session?.subscription;

      if (addonSlugs && checkoutUserId) {
        console.log("📦 Processing add-on checkout:", { addonSlugs, checkoutUserId });

        const slugs = addonSlugs.split(",").filter(Boolean);

        // Store stripe_subscription_id on subscriber
        if (stripeSubscriptionId) {
          await supabase
            .from("subscribers")
            .update({
              stripe_subscription_id: String(stripeSubscriptionId),
              updated_at: new Date().toISOString()
            })
            .eq("user_id", checkoutUserId);
        }

        for (const slug of slugs) {
          const { data: addon } = await supabase
            .from("addon_catalog")
            .select("id, slug, name")
            .eq("slug", slug)
            .maybeSingle();

          if (addon) {
            const isFamily = slug === "family_link";
            await supabase
              .from("member_addons")
              .upsert({
                user_id: checkoutUserId,
                addon_id: addon.id,
                status: "active",
                quantity: 1,
                free_units: isFamily ? 1 : 0,
                activated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: "user_id,addon_id" });

            console.log(`✅ Add-on '${slug}' activated for user ${checkoutUserId}`);
          }
        }

        // Check CLARA Complete unlock
        const { data: activeAddons } = await supabase
          .from("member_addons")
          .select("addon_catalog(slug)")
          .eq("user_id", checkoutUserId)
          .eq("status", "active");

        const activeSlugs = (activeAddons || []).map((a: any) => a.addon_catalog?.slug).filter(Boolean);
        const claraUnlocked = activeSlugs.includes("daily_wellbeing") && activeSlugs.includes("medication_reminder");

        await supabase
          .from("subscribers")
          .update({
            active_addons: activeSlugs,
            clara_complete_unlocked: claraUnlocked,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", checkoutUserId);

        if (claraUnlocked) {
          await supabase.from("clara_unlock_log").insert({
            user_id: checkoutUserId,
            event_type: "unlocked",
            reason: "Both daily_wellbeing and medication_reminder activated via checkout",
            daily_wellbeing_active: true,
            medication_reminder_active: true
          });
          console.log("🎉 CLARA Complete unlocked for user", checkoutUserId);
        }

        // If user was trialing, mark as converted
        const { data: trial } = await supabase
          .from("trial_tracking")
          .select("id, status")
          .eq("user_id", checkoutUserId)
          .eq("status", "active")
          .maybeSingle();

        if (trial) {
          await supabase
            .from("trial_tracking")
            .update({
              status: "converted",
              converted_at: new Date().toISOString(),
              plan_after_trial: "Individual"
            })
            .eq("id", trial.id);

          await supabase
            .from("subscribers")
            .update({
              is_trialing: false,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", checkoutUserId);

          console.log("✅ Trial converted to paid for user", checkoutUserId);
        }
      }
    }

    // Handle gift subscription checkout completion
    if (event.type === "checkout.session.completed") {
      const session = event?.data?.object;
      const giftId = session?.metadata?.gift_id;
      const giftRedeemCode = session?.metadata?.redeem_code;

      if (giftId) {
        console.log("🎁 Processing gift checkout:", { giftId, giftRedeemCode });

        try {
          // Update gift status to paid
          const { error: giftUpdateError } = await supabase
            .from("gift_subscriptions")
            .update({
              status: "paid",
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent ? String(session.payment_intent) : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", giftId)
            .eq("status", "pending_payment");

          if (giftUpdateError) {
            console.error("❌ Error updating gift status:", giftUpdateError);
          } else {
            console.log("✅ Gift marked as paid");
          }

          // Check if gift should be delivered immediately (no delivery_date or delivery_date <= today)
          const { data: giftData } = await supabase
            .from("gift_subscriptions")
            .select("delivery_date")
            .eq("id", giftId)
            .single();

          const today = new Date().toISOString().split("T")[0];
          const shouldDeliverNow = !giftData?.delivery_date || giftData.delivery_date <= today;

          if (shouldDeliverNow) {
            console.log("📧 Delivering gift immediately");
            // Call gift-send-email to send both recipient and buyer emails
            const { error: emailError } = await supabase.functions.invoke("gift-send-email", {
              body: { gift_id: giftId, type: "both" },
            });

            if (emailError) {
              console.error("❌ Error sending gift emails:", emailError);
            } else {
              console.log("✅ Gift emails sent");
            }
          } else {
            console.log("📅 Gift scheduled for future delivery:", giftData?.delivery_date);
            // Send buyer confirmation only (recipient email will be sent by cron)
            const { error: emailError } = await supabase.functions.invoke("gift-send-email", {
              body: { gift_id: giftId, type: "buyer" },
            });

            if (emailError) {
              console.error("❌ Error sending buyer confirmation:", emailError);
            } else {
              console.log("✅ Buyer confirmation sent, delivery scheduled");
            }
          }
        } catch (giftErr) {
          console.error("❌ Error processing gift checkout:", giftErr);
        }
      }
    }

    return new Response(JSON.stringify({
      received: true,
      processed: true,
      event_type: event.type,
      owner_user_id: ownerUserId
    }), {
      headers: { "content-type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Stripe webhook error:", error);
    return new Response(JSON.stringify({ 
      error: String(error?.message ?? error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
});