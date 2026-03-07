import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, MapPin, Activity, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FamilyGroup {
  id: string;
  owner_user_id: string;
  created_at: string;
  member_count: number;
  active_members: number;
  recent_activity: number;
}

export default function CircleAnalyticsPage() {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalGroups: 0,
    totalMembers: 0,
    activeGroups: 0,
    avgGroupSize: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get family groups with member counts and activity
      const { data: groupsData, error: groupsError } = await supabase
        .from('family_groups')
        .select(`
          *,
          family_memberships!inner(count)
        `);

      if (groupsError) throw groupsError;

      // Get live presence data for activity analysis
      const { data: presenceData, error: presenceError } = await supabase
        .from('live_presence')
        .select('user_id, last_seen');

      if (presenceError) throw presenceError;

      // Calculate analytics
      const enrichedGroups = groupsData?.map(group => {
        const memberCount = group.family_memberships?.length || 0;
        const activeMembers = presenceData?.filter(p => 
          new Date(p.last_seen).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Active in last 24h
        ).length || 0;
        
        return {
          ...group,
          member_count: memberCount,
          active_members: activeMembers,
          recent_activity: activeMembers
        };
      }) || [];

      const totalMembers = enrichedGroups.reduce((sum, group) => sum + group.member_count, 0);
      const activeGroups = enrichedGroups.filter(group => group.recent_activity > 0).length;
      const avgGroupSize = enrichedGroups.length > 0 ? totalMembers / enrichedGroups.length : 0;

      setFamilyGroups(enrichedGroups);
      setAnalytics({
        totalGroups: enrichedGroups.length,
        totalMembers,
        activeGroups,
        avgGroupSize: Math.round(avgGroupSize * 10) / 10
      });

    } catch (error) {
      console.error('Error loading circle analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load circle analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Circle Analytics</h1>
          <p className="text-muted-foreground">Family group insights and member activity</p>
        </div>
        <Button onClick={loadAnalytics} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.totalGroups}</div>
            <p className="text-xs text-muted-foreground">Family circles created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all circles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.activeGroups}</div>
            <p className="text-xs text-muted-foreground">With recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Group Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.avgGroupSize}</div>
            <p className="text-xs text-muted-foreground">Members per group</p>
          </CardContent>
        </Card>
      </div>

      {/* Family Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>Family Groups Details</CardTitle>
          <CardDescription>Detailed view of all family circles and their activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {familyGroups.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No family groups found</p>
            ) : (
              familyGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      group.recent_activity > 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium">Group {group.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{group.member_count}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-semibold text-green-600">{group.active_members}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={group.recent_activity > 0 ? "default" : "secondary"}>
                        {group.recent_activity > 0 ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Size Distribution</CardTitle>
            <CardDescription>How members are distributed across groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(size => {
                const count = familyGroups.filter(g => g.member_count === size).length;
                const percentage = familyGroups.length > 0 ? (count / familyGroups.length) * 100 : 0;
                return (
                  <div key={size} className="flex items-center justify-between">
                    <span className="text-sm">{size} member{size > 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Levels</CardTitle>
            <CardDescription>Family group engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Very Active (5+ members active)</span>
                <Badge variant="default">
                  {familyGroups.filter(g => g.active_members >= 5).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active (2-4 members active)</span>
                <Badge variant="secondary">
                  {familyGroups.filter(g => g.active_members >= 2 && g.active_members < 5).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Activity (1 member active)</span>
                <Badge variant="outline">
                  {familyGroups.filter(g => g.active_members === 1).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inactive (no recent activity)</span>
                <Badge variant="destructive">
                  {familyGroups.filter(g => g.active_members === 0).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}