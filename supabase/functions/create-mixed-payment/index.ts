import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MIXED-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started - create-mixed-payment");

    const { 
      subscriptionPlans = [], 
      products = [], 
      regionalServices = [], 
      email, 
      firstName, 
      lastName, 
      currency = 'EUR', 
      testingMode = false 
    } = await req.json();
    
    if (!email) {
      throw new Error("Email is required for payment processing");
    }
    
    logStep("Request data received", { 
      email, 
      firstName, 
      lastName, 
      subscriptionPlans: subscriptionPlans?.length || 0, 
      products: products?.length || 0, 
      regionalServices: regionalServices?.length || 0, 
      currency, 
      testingMode 
    });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2024-06-20" 
    });
    
    // Check if customer exists or create new one
    const customers = await stripe.customers.list({ 
      email: email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create customer
      const customer = await stripe.customers.create({
        email: email,
        name: `${firstName || ''} ${lastName || ''}`.trim(),
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Initialize totals
    let subscriptionSubtotal = 0;
    let subscriptionData = [];
    let regionalSubtotal = 0;
    let regionalData = [];
    let productSubtotal = 0;
    let productData = [];

    // Fetch subscription plans from database
    if (subscriptionPlans && subscriptionPlans.length > 0) {
      try {
        const { data: dbPlans, error: planError } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .in('id', subscriptionPlans);

        if (planError) {
          logStep("Error fetching subscription plans", planError);
          throw new Error(`Error fetching subscription plans: ${planError.message}`);
        }
        
        subscriptionSubtotal = (dbPlans || []).reduce((total, plan) => {
          return total + parseFloat(plan.price.toString());
        }, 0);
        
        subscriptionData = dbPlans || [];
        logStep("Fetched subscription plans", { 
          count: subscriptionData.length, 
          subtotal: subscriptionSubtotal 
        });
      } catch (error) {
        logStep("Subscription plans fetch error", error);
        throw error;
      }
    }

    // Fetch regional services from database
    if (regionalServices && regionalServices.length > 0) {
      try {
        const { data: dbServices, error: serviceError } = await supabaseClient
          .from('regional_services')
          .select('*')
          .in('id', regionalServices);

        if (serviceError) {
          logStep("Error fetching regional services", serviceError);
          throw new Error(`Error fetching regional services: ${serviceError.message}`);
        }
        
        regionalSubtotal = (dbServices || []).reduce((total, service) => {
          return total + parseFloat(service.price.toString());
        }, 0);
        
        regionalData = dbServices || [];
        logStep("Fetched regional services", { 
          count: regionalData.length, 
          subtotal: regionalSubtotal 
        });
      } catch (error) {
        logStep("Regional services fetch error", error);
        throw error;
      }
    }

    // Fetch products from database for one-time purchases
    if (products && products.length > 0) {
      try {
        const { data: dbProducts, error: productError } = await supabaseClient
          .from('products')
          .select('*')
          .in('id', products);

        if (productError) {
          logStep("Error fetching products", productError);
          throw new Error(`Error fetching products: ${productError.message}`);
        }
        
        productSubtotal = (dbProducts || []).reduce((total, product) => {
          return total + parseFloat(product.price.toString());
        }, 0);
        
        productData = dbProducts || [];
        logStep("Fetched products", { 
          count: productData.length, 
          subtotal: productSubtotal 
        });
      } catch (error) {
        logStep("Products fetch error", error);
        throw error;
      }
    }

    // Calculate taxes (matching frontend calculation)
    const PRODUCT_IVA_RATE = 0.21; // 21% for products
    const SERVICE_IVA_RATE = 0.10; // 10% for regional services
    
    const subscriptionTotal = subscriptionSubtotal; // No tax on subscription plans
    const regionalTotal = regionalSubtotal * (1 + SERVICE_IVA_RATE); // Add 10% IVA
    const productTotal = productSubtotal * (1 + PRODUCT_IVA_RATE); // Add 21% IVA
    
    const totalAmount = subscriptionTotal + regionalTotal + productTotal;
    
    logStep("Calculated totals", { 
      subscriptionTotal, 
      regionalTotal, 
      productTotal, 
      totalAmount, 
      testingMode 
    });

    // Handle testing mode - return free test mode response
    if (testingMode) {
      logStep("Testing mode enabled - returning test response");
      return new Response(JSON.stringify({ 
        client_secret: "test_mode_no_payment",
        customer_id: customerId,
        subscription_total: subscriptionTotal,
        product_total: productTotal,
        regional_total: regionalTotal,
        total_amount: 0,
        test_mode: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    if (totalAmount === 0) {
      throw new Error("No valid items selected for payment or total amount is zero");
    }

    // Prepare metadata for Stripe payment intent
    const metadataToSend = {
      email: email,
      subscription_plans: JSON.stringify(subscriptionPlans || []),
      products: JSON.stringify(products || []),
      regional_services: JSON.stringify(regionalServices || []),
      subscription_amount: subscriptionTotal.toString(),
      product_amount: productTotal.toString(),
      regional_amount: regionalTotal.toString(),
      payment_currency: currency,
      testing_mode: testingMode.toString(),
    };
    
    // Log metadata for debugging
    Object.entries(metadataToSend).forEach(([key, value]) => {
      logStep(`Metadata ${key}`, { 
        length: value.length, 
        preview: value.substring(0, 100) 
      });
    });

    // Create payment intent for the total amount (convert to cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: metadataToSend,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logStep("Payment intent created successfully", { 
      paymentIntentId: paymentIntent.id, 
      amountCents: Math.round(totalAmount * 100),
      currency: currency.toLowerCase()
    });

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret,
      customer_id: customerId,
      subscription_total: subscriptionTotal,
      product_total: productTotal,
      regional_total: regionalTotal,
      total_amount: totalAmount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    logStep("ERROR in create-mixed-payment", { 
      message: errorMessage,
      stack: errorStack
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      function: "create-mixed-payment"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});