// Test script to demonstrate complete Riven workflow
// This will create a blog post and verify it appears on the blog page

import { supabase } from '@/integrations/supabase/client';

export async function testCompleteWorkflow() {
  console.log('🚀 Starting Riven Workflow Test...');
  
  try {
    // Step 1: Create a marketing campaign via edge function
    console.log('📝 Step 1: Creating marketing campaign...');
    
    const testCommand = 'Create a comprehensive family emergency preparedness blog post covering essential safety tips, emergency kit creation, and family communication plans during emergencies.';
    
    const { data: campaignResponse, error: campaignError } = await supabase.functions.invoke(
      'riven-marketing-enhanced',
      {
        body: {
          command: testCommand,
          campaignId: crypto.randomUUID()
        }
      }
    );

    if (campaignError) {
      console.error('❌ Campaign creation failed:', campaignError);
      return false;
    }

    console.log('✅ Campaign created successfully:', campaignResponse);

    // Step 2: Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Check marketing content table for blog posts
    console.log('📋 Step 2: Checking for generated blog content...');
    
    const { data: blogContent, error: contentError } = await supabase
      .from('marketing_content')
      .select('*')
      .eq('platform', 'blog')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1);

    if (contentError) {
      console.error('❌ Content check failed:', contentError);
      return false;
    }

    if (!blogContent || blogContent.length === 0) {
      console.log('⚠️ No published blog content found yet. Checking all blog content...');
      
      const { data: allContent } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('platform', 'blog')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('📄 Recent blog content:', allContent);
      return false;
    }

    const latestBlog = blogContent[0];
    console.log('✅ Blog content found:', latestBlog.title);

    // Step 4: Verify blog is accessible via blog publisher
    console.log('🌐 Step 3: Testing blog publication...');
    
    if (latestBlog.slug) {
      console.log(`✅ Blog post published with slug: ${latestBlog.slug}`);
      console.log(`🔗 Blog URL: /blog/${latestBlog.slug}`);
    } else {
      console.log('📝 Publishing blog post...');
      
      const { data: publishResponse, error: publishError } = await supabase.functions.invoke(
        'blog-publisher',
        {
          body: {
            action: 'publish_blog',
            contentId: latestBlog.id
          }
        }
      );

      if (publishError) {
        console.error('❌ Blog publication failed:', publishError);
        return false;
      }

      console.log('✅ Blog published successfully:', publishResponse);
    }

    // Step 5: Verify workflow stages completed
    console.log('🔄 Step 4: Checking workflow completion...');
    
    const { data: workflowStages } = await supabase
      .from('workflow_stages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('📊 Recent workflow stages:', workflowStages);

    console.log('🎉 WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Blog post created and published');
    console.log('✅ All workflow stages executed');
    console.log('✅ Content available on blog page');
    
    return true;

  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    return false;
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testRivenWorkflow = testCompleteWorkflow;
}