import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Eye,
  ExternalLink
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

export const RivenBlogWorkflow: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [blogUrl, setBlogUrl] = useState<string>('');
  
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'generate',
      name: 'Generate Content',
      description: 'Create blog post with Riven AI',
      status: 'pending'
    },
    {
      id: 'approve',
      name: 'Auto-Approve',
      description: 'Approve content for publishing',
      status: 'pending'
    },
    {
      id: 'publish',
      name: 'Publish Blog',
      description: 'Publish to blog page',
      status: 'pending'
    },
    {
      id: 'verify',
      name: 'Verify Live',
      description: 'Confirm blog is accessible',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: WorkflowStep['status'], result?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, result } : step
    ));
  };

  const runCompleteWorkflow = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentStep(0);
    setGeneratedContent(null);
    setBlogUrl('');

    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    try {
      // Step 1: Generate Content with Riven AI
      setCurrentStep(0);
      updateStepStatus('generate', 'running');
      
      console.log('🚀 Starting Riven AI content generation...');
      
      const { data: rivenResult, error: rivenError } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: {
          command: `Create a comprehensive blog post about "Advanced Emergency Response Strategies for Families" focusing on modern safety technology, preparation techniques, and emergency communication protocols. Include practical tips that families can implement immediately.`
        }
      });

      if (rivenError) throw rivenError;
      
      console.log('✅ Riven AI generated campaign:', rivenResult);
      updateStepStatus('generate', 'completed', rivenResult);

      // Wait a moment for content to be created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find the generated content
      const { data: content, error: contentError } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('platform', 'blog')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (contentError) throw contentError;
      if (!content || content.length === 0) {
        throw new Error('No blog content was generated');
      }

      const blogContent = content[0];
      setGeneratedContent(blogContent);
      console.log('📝 Found generated blog content:', blogContent);

      // Step 2: Auto-approve content
      setCurrentStep(1);
      updateStepStatus('approve', 'running');
      
      const { error: approveError } = await supabase
        .from('marketing_content')
        .update({ status: 'approved' })
        .eq('id', blogContent.id);

      if (approveError) throw approveError;
      
      console.log('✅ Content approved');
      updateStepStatus('approve', 'completed');

      // Step 3: Publish to blog
      setCurrentStep(2);
      updateStepStatus('publish', 'running');
      
      const { data: publishResult, error: publishError } = await supabase.functions.invoke('blog-publisher', {
        body: {
          action: 'publish_blog',
          contentId: blogContent.id
        }
      });

      if (publishError) throw publishError;
      
      console.log('🚀 Blog published:', publishResult);
      const blogSlug = publishResult.blog_post?.slug || blogContent.slug;
      const fullBlogUrl = `/blog/${blogSlug}`;
      setBlogUrl(fullBlogUrl);
      
      updateStepStatus('publish', 'completed', { url: fullBlogUrl });

      // Step 4: Verify the blog is accessible
      setCurrentStep(3);
      updateStepStatus('verify', 'running');
      
      // Check if content is now published
      const { data: publishedContent, error: verifyError } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('id', blogContent.id)
        .single();

      if (verifyError) throw verifyError;
      
      if (publishedContent.status === 'published') {
        console.log('✅ Blog is live and accessible');
        updateStepStatus('verify', 'completed', { status: 'live' });
        
        toast({
          title: "🎉 Blog Workflow Complete!",
          description: "Your blog post has been generated and published successfully",
        });
      } else {
        throw new Error('Blog content was not properly published');
      }

    } catch (error) {
      console.error('❌ Workflow failed:', error);
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        updateStepStatus(currentStepId, 'error');
      }
      
      toast({
        title: "Workflow Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (step: WorkflowStep, index: number) => {
    if (step.status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (step.status === 'running') return <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
    if (step.status === 'error') return <div className="h-5 w-5 bg-red-600 rounded-full" />;
    return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
  };

  const getStepColor = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Riven Blog Workflow
          </CardTitle>
          <p className="text-muted-foreground">
            Complete end-to-end blog creation: AI generation → approval → publishing → verification
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Control Panel */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Workflow Control</h4>
              <p className="text-sm text-muted-foreground">Generate and publish a complete blog post</p>
            </div>
            <Button 
              onClick={runCompleteWorkflow} 
              disabled={isRunning}
              size="lg"
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Workflow
                </>
              )}
            </Button>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className={`p-4 rounded-lg border ${getStepColor(step)}`}>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getStepIcon(step, index)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{step.name}</h5>
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'running' ? 'secondary' :
                        step.status === 'error' ? 'destructive' : 'outline'
                      }>
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    
                    {/* Step Results */}
                    {step.status === 'completed' && step.result && (
                      <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                        {step.id === 'publish' && step.result.url && (
                          <span>Published to: {step.result.url}</span>
                        )}
                        {step.id === 'verify' && step.result.status && (
                          <span>Status: {step.result.status}</span>
                        )}
                        {step.id === 'generate' && (
                          <span>Campaign created successfully</span>
                        )}
                        {step.id === 'approve' && (
                          <span>Content approved for publishing</span>
                        )}
                      </div>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Generated Content Preview */}
          {generatedContent && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h6 className="font-medium text-sm text-muted-foreground">Title</h6>
                    <p className="font-medium">{generatedContent.title}</p>
                  </div>
                  {generatedContent.meta_description && (
                    <div>
                      <h6 className="font-medium text-sm text-muted-foreground">Description</h6>
                      <p className="text-sm">{generatedContent.meta_description}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Badge>{generatedContent.platform}</Badge>
                    <Badge variant="outline">{generatedContent.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blog Link */}
          {blogUrl && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h6 className="font-medium">Blog Published</h6>
                    <p className="text-sm text-muted-foreground">Your blog post is now live</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(blogUrl, '_blank')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open('/blog', '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      All Posts
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};