import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TestTube, Play, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

export const WorkflowTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const testSteps = [
    { id: 'campaign', name: 'Create Campaign', description: 'Generate marketing campaign via Riven AI' },
    { id: 'content', name: 'Generate Content', description: 'AI creates blog post content' },
    { id: 'publish', name: 'Publish Blog', description: 'Publish content to blog page' },
    { id: 'verify', name: 'Verify Access', description: 'Confirm blog is accessible' }
  ];

  const runCompleteTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep('Starting test...');
    
    try {
      // Step 1: Create campaign
      setCurrentStep('Creating marketing campaign...');
      const testCommand = 'Create a comprehensive family emergency preparedness blog post covering essential safety tips, emergency kit creation, and family communication plans during emergencies.';
      const campaignId = crypto.randomUUID();
      
      const { data: campaignResponse, error: campaignError } = await supabase.functions.invoke(
        'riven-marketing-enhanced',
        {
          body: {
            command: testCommand,
            campaignId: campaignId
          }
        }
      );

      if (campaignError) throw new Error(`Campaign creation failed: ${campaignError.message}`);
      
      setTestResults(prev => [...prev, {
        step: 'campaign',
        status: 'success',
        message: 'Campaign created successfully',
        data: campaignResponse
      }]);

      // Step 2: Wait and check for content
      setCurrentStep('Waiting for content generation...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const { data: blogContent, error: contentError } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('platform', 'blog')
        .order('created_at', { ascending: false })
        .limit(1);

      if (contentError) throw new Error(`Content check failed: ${contentError.message}`);
      
      if (!blogContent || blogContent.length === 0) {
        throw new Error('No blog content generated');
      }

      const latestBlog = blogContent[0];
      setTestResults(prev => [...prev, {
        step: 'content',
        status: 'success',
        message: `Blog content generated: "${latestBlog.title}"`,
        data: latestBlog
      }]);

      // Step 3: Publish if needed
      setCurrentStep('Publishing blog post...');
      
      if (!latestBlog.slug || latestBlog.status !== 'published') {
        const { data: publishResponse, error: publishError } = await supabase.functions.invoke(
          'blog-publisher',
          {
            body: {
              action: 'publish_blog',
              contentId: latestBlog.id
            }
          }
        );

        if (publishError) throw new Error(`Publishing failed: ${publishError.message}`);
        
        setTestResults(prev => [...prev, {
          step: 'publish',
          status: 'success',
          message: 'Blog published successfully',
          data: publishResponse
        }]);
      } else {
        setTestResults(prev => [...prev, {
          step: 'publish',
          status: 'success',
          message: 'Blog already published',
          data: { slug: latestBlog.slug }
        }]);
      }

      // Step 4: Verify blog is accessible
      setCurrentStep('Verifying blog access...');
      
      const { data: verifyContent } = await supabase
        .from('marketing_content')
        .select('slug, title, status')
        .eq('id', latestBlog.id)
        .single();

      if (verifyContent?.slug && verifyContent.status === 'published') {
        setTestResults(prev => [...prev, {
          step: 'verify',
          status: 'success',
          message: `Blog accessible at /blog/${verifyContent.slug}`,
          data: { url: `/blog/${verifyContent.slug}` }
        }]);

        toast({
          title: "🎉 Workflow Test Completed!",
          description: `Blog post successfully created and published at /blog/${verifyContent.slug}`,
        });
      } else {
        throw new Error('Blog not accessible');
      }

      setCurrentStep('Test completed successfully!');

    } catch (error: any) {
      console.error('Workflow test failed:', error);
      setTestResults(prev => [...prev, {
        step: currentStep,
        status: 'error',
        message: error.message,
        data: error
      }]);

      toast({
        title: "❌ Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const getStepStatus = (stepId: string) => {
    const result = testResults.find(r => r.step === stepId);
    if (!result) return 'pending';
    return result.status;
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-primary" />
          Workflow Tester
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the complete Riven workflow from command to published blog post
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={runCompleteTest} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Test...' : 'Run Complete Test'}
          </Button>
          
          {isRunning && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {currentStep}
            </Badge>
          )}
        </div>

        {/* Test Progress */}
        <div className="space-y-3">
          {testSteps.map((step, index) => {
            const status = getStepStatus(step.id);
            const result = testResults.find(r => r.step === step.id);
            
            return (
              <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  {getStepIcon(status)}
                  <div>
                    <div className="font-medium">{step.name}</div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                    {result && (
                      <div className={`text-xs mt-1 ${
                        result.status === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>
                
                {index < testSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Results Summary */}
        {testResults.length > 0 && (
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {getStepIcon(result.status)}
                    <span className="font-medium">{result.step}:</span>
                    <span className={
                      result.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }>
                      {result.message}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};