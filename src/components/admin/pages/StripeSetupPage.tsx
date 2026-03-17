import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function StripeSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupResults, setSetupResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStripeSetup = async () => {
    setIsLoading(true);
    setError(null);
    setSetupResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('setup-stripe-products');
      
      if (error) {
        throw error;
      }

      if (data.success) {
        setSetupResults(data.results);
        toast.success("Stripe setup completed successfully!");
      } else {
        throw new Error(data.error || "Setup failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during setup");
      toast.error("Setup failed: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-8 py-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stripe Account Setup</h1>
        <p className="text-muted-foreground">
          Set up your new Stripe account with all products and services
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automated Stripe Setup</CardTitle>
          <CardDescription>
            This will create all your products and services in your new Stripe account:
            <ul className="mt-2 space-y-1">
              <li>• Individual Plan (€9.99/mo) + Add-ons (Wellbeing, Medication, Extra Family Link at €2.99/mo each)</li>
              <li>• 1 Physical Product (LifeLink Sync Bluetooth Pendant)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 py-6 w-full space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleStripeSetup} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up Stripe products...
              </>
            ) : (
              "Start Stripe Setup"
            )}
          </Button>

          {setupResults && (
            <div className="px-8 py-6 w-full space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Setup completed successfully! All products have been created in Stripe.
                </AlertDescription>
              </Alert>

              <div className="px-8 py-6 w-full space-y-4">
                {setupResults.subscriptionPlans.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Subscription Plans Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {setupResults.subscriptionPlans.map((plan: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-medium">{plan.plan_name}</span>
                            <span className="text-sm text-muted-foreground">
                              Price ID: {plan.price_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {setupResults.regionalServices.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Regional Services Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {setupResults.regionalServices.map((service: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-medium">{service.service_name}</span>
                            <span className="text-sm text-muted-foreground">
                              Price ID: {service.price_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {setupResults.products.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Products Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {setupResults.products.map((product: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-medium">{product.product_name}</span>
                            <span className="text-sm text-muted-foreground">
                              Price ID: {product.price_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  Next steps:
                  <ul className="mt-2 space-y-1">
                    <li>• Configure your Stripe Dashboard settings</li>
                    <li>• Set up webhooks if needed</li>
                    <li>• Test payment flows</li>
                    <li>• Enable your preferred payment methods</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}