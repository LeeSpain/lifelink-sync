// Test script for Riven Enhanced Function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqroziggaalltuzoyyao.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcm96aWdnYWFsbHR1em95eWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTIwOTIsImV4cCI6MjA2OTQ2ODA5Mn0.B8RH5FtncIduK9XTRNnsMn1PeScam2MFIvqjdOKO6Ds';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testRivenEnhanced() {
  console.log('🧪 Testing Riven Enhanced Function...');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing Provider Status...');
    const healthResponse = await supabase.functions.invoke('riven-marketing-enhanced', {
      body: { action: 'provider_status' }
    });
    
    console.log('Health Check Result:', healthResponse.data);
    
    if (!healthResponse.data?.success) {
      console.error('❌ Health check failed');
      return;
    }
    
    // Test 2: Content Generation
    console.log('2. Testing Content Generation...');
    const contentResponse = await supabase.functions.invoke('riven-marketing-enhanced', {
      body: {
        command: 'Create a comprehensive blog post about emergency preparedness for families',
        title: 'Family Emergency Preparedness Guide',
        settings: {
          word_count: 1200,
          content_depth: 'high',
          seo_difficulty: 'medium'
        },
        scheduling_options: {
          mode: 'spread',
          spread_days: 7,
          posts_per_day: 1,
          total_posts: 1
        },
        publishing_controls: {
          platforms: ['blog'],
          approval_required: true
        }
      }
    });
    
    console.log('Content Generation Result:', contentResponse.data);
    
    if (contentResponse.data?.success) {
      console.log('✅ Riven Enhanced Function is working correctly!');
      console.log('Campaign ID:', contentResponse.data.campaign_id);
    } else {
      console.error('❌ Content generation failed:', contentResponse.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  testRivenEnhanced();
}