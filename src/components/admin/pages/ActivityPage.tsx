import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Activity, Clock, User, Zap } from 'lucide-react';

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  description?: string;
  metadata?: any;
  created_at: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, typeFilter, activities]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data: activitiesData, error } = await supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error loading activities:', error);
        return;
      }

      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.user_id.toLowerCase().includes(searchLower) ||
        activity.activity_type.toLowerCase().includes(searchLower) ||
        activity.description?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === typeFilter);
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <User className="h-4 w-4" />;
      case 'profile_update':
        return <User className="h-4 w-4" />;
      case 'subscription':
        return <Zap className="h-4 w-4" />;
      case 'emergency':
        return <Activity className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-blue-500';
      case 'profile_update':
        return 'bg-green-500';
      case 'subscription':
        return 'bg-purple-500';
      case 'emergency':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatActivityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const activityTypes = [...new Set(activities.map(a => a.activity_type))];

  const stats = {
    total: activities.length,
    today: activities.filter(a => 
      new Date(a.created_at).toDateString() === new Date().toDateString()
    ).length,
    thisWeek: activities.filter(a => {
      const activityDate = new Date(a.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= weekAgo;
    }).length,
    uniqueUsers: new Set(activities.map(a => a.user_id)).size
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Activity</h1>
          <p className="text-muted-foreground">Loading activity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Activity</h1>
          <p className="text-muted-foreground">Monitor user actions and engagement</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-xl font-bold">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-xl font-bold">{stats.thisWeek}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {formatActivityType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getActivityColor(activity.activity_type)}>
                          {getActivityIcon(activity.activity_type)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {formatActivityType(activity.activity_type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {activity.user_id.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs">
                        {activity.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground max-w-xs">
                        {activity.metadata ? (
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        ) : (
                          'No metadata'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}