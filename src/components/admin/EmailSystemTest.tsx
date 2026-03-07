import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const EmailSystemTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { testEmailSystem, triggerUserSignup } = useEmailAutomation();

  const runFullTest = async () => {
    setTesting(true);
    setResults([]);

    const testResults: TestResult[] = [
      { name: 'Queue Processing', status: 'pending', message: 'Testing...' },
      { name: 'Scheduler Function', status: 'pending', message: 'Testing...' },
      { name: 'Welcome Email', status: 'pending', message: 'Testing...' },
      { name: 'Database Connection', status: 'pending', message: 'Testing...' },
    ];

    setResults([...testResults]);

    try {
      // Test 1: Email System Functions
      const systemTest = await testEmailSystem();
      
      testResults[0].status = systemTest.queue ? 'success' : 'error';
      testResults[0].message = systemTest.queue ? 'Queue processing works' : 'Queue processing failed';
      
      testResults[1].status = systemTest.scheduler ? 'success' : 'error';
      testResults[1].message = systemTest.scheduler ? 'Scheduler function works' : 'Scheduler function failed';
      
      setResults([...testResults]);

      // Test 2: Send Welcome Email
      try {
        const welcomeResponse = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: 'test@example.com',
            name: 'Test User',
            firstName: 'Test'
          }
        });

        testResults[2].status = welcomeResponse.error ? 'error' : 'success';
        testResults[2].message = welcomeResponse.error 
          ? `Welcome email failed: ${welcomeResponse.error.message}`
          : 'Welcome email sent successfully';
      } catch (error: any) {
        testResults[2].status = 'error';
        testResults[2].message = `Welcome email error: ${error.message}`;
      }

      setResults([...testResults]);

      // Test 3: Database Connection
      try {
        const { data, error } = await supabase
          .from('email_templates')
          .select('count(*)')
          .limit(1);

        testResults[3].status = error ? 'error' : 'success';
        testResults[3].message = error 
          ? `Database error: ${error.message}`
          : 'Database connection successful';
      } catch (error: any) {
        testResults[3].status = 'error';
        testResults[3].message = `Database connection failed: ${error.message}`;
      }

      setResults([...testResults]);

      // Show summary
      const successCount = testResults.filter(r => r.status === 'success').length;
      const totalTests = testResults.length;
      
      if (successCount === totalTests) {
        toast.success('All email system tests passed!');
      } else {
        toast.warning(`${successCount}/${totalTests} tests passed. Check results for details.`);
      }

    } catch (error: any) {
      toast.error(`Test suite failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pass</Badge>;
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      case 'pending':
        return <Badge variant="outline">Testing...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Email System Test Suite
        </CardTitle>
        <CardDescription>
          Comprehensive test to verify all email system components are working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runFullTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Full Email System Test'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Required for Email System:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• RESEND_API_KEY must be configured in Supabase Edge Function secrets</li>
            <li>• Domain must be verified in Resend dashboard</li>
            <li>• Cron extension enabled for scheduled emails</li>
            <li>• Email templates must be active in database</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};