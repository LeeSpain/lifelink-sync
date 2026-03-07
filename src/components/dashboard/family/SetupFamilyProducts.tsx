import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle } from "lucide-react";

const SetupFamilyProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-family-stripe-products');

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setIsSetup(true);
      toast({
        title: "Success",
        description: "Family Access products have been set up successfully in Stripe!"
      });

    } catch (error) {
      console.error('Error setting up family products:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set up family products",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetup) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Family Access products configured successfully!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Package className="h-5 w-5" />
          Family Access Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-blue-700">
            Before using Family Access features, you need to set up the required Stripe products. 
            This will create the Family Access subscription product (€2.99/month per seat) in your Stripe account.
          </p>
          <Button
            onClick={handleSetup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Setting up..." : "Set Up Family Access Products"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupFamilyProducts;