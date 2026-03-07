import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialMediaManager } from './SocialMediaManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Plus,
  Settings,
  Activity,
  Users,
  Eye,
  Calendar,
  TrendingUp,
  Loader2
} from 'lucide-react';

export const SocialHub: React.FC = () => {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealSocialData();
  }, []);

  const loadRealSocialData = async () => {
    try {
      // For now, show empty state since no social accounts are connected yet
      // This will be populated when users connect real social media accounts
      setConnectedAccounts([]);

      // Load real published content for activity from existing table
      const { data: publishedContent } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('status', 'published')
        .order('posted_at', { ascending: false })
        .limit(5);

      setRecentActivity(publishedContent || []);
    } catch (error) {
      console.error('Error loading social data:', error);
      setConnectedAccounts([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <SocialMediaManager />
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Posting Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Posting schedule will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading activity...</span>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent social media activity. Publish content to see activity here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((content) => (
                    <div key={content.id} className="flex items-center gap-4 p-3 bg-muted/20 rounded">
                      <Activity className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{content.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Published: {new Date(content.posted_at).toLocaleDateString()} • Platform: {content.platform}
                        </p>
                      </div>
                      <Badge variant="outline">Published</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Social Media Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};