import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-INVOICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const invoiceId = url.searchParams.get("invoiceId");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    if (action === "download" && invoiceId) {
      // Download specific invoice PDF
      const invoice = await stripe.invoices.retrieve(invoiceId);
      if (invoice.customer !== customerId) {
        throw new Error("Invoice not found or unauthorized");
      }
      
      if (!invoice.invoice_pdf) {
        throw new Error("PDF not available for this invoice");
      }

      logStep("Downloading invoice PDF", { invoiceId, pdfUrl: invoice.invoice_pdf });
      
      return new Response(JSON.stringify({ 
        downloadUrl: invoice.invoice_pdf,
        invoiceNumber: invoice.number,
        filename: `invoice-${invoice.number}.pdf`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Get invoice history
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: 20,
        status: "paid"
      });

      const invoiceHistory = invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000).toISOString(),
        period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
        period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
        pdf_available: !!invoice.invoice_pdf,
        description: invoice.lines.data[0]?.description || "Subscription"
      }));

      logStep("Retrieved invoice history", { count: invoiceHistory.length });

      return new Response(JSON.stringify({ invoices: invoiceHistory }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in billing-invoices", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});