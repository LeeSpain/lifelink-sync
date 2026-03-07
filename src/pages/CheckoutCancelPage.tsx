import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { PageSEO } from '@/components/PageSEO';

const CheckoutCancelPage = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');

  return (
    <>
      <PageSEO pageType="register" />
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <XCircle className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Checkout Cancelled</CardTitle>
            <CardDescription>
              No worries! Your payment was not processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              If you experienced any issues during checkout or have questions about our plans, 
              please don't hesitate to contact our support team.
            </p>
            
            <div className="flex flex-col gap-3">
              {planId ? (
                <Button asChild className="w-full">
                  <Link to={`/checkout?plan=${planId}`}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to="/#pricing">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    View Plans
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
            
            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Need help? Contact us at{' '}
                <a href="mailto:support@lifelink-sync.com" className="text-primary hover:underline">
                  support@lifelink-sync.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CheckoutCancelPage;
