import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, Calendar, UserPlus, Globe, BarChart3 } from 'lucide-react';

interface GrowthData {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  growthRate: number;
  activeUsers: number;
  usersByCountry: { [key: string]: number };
}

export default function UserGrowthPage() {
  const [growthData, setGrowthData] = useState<GrowthData>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    newUsersLastMonth: 0,
    growthRate: 0,
    activeUsers: 0,
    usersByCountry: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrowthData();
  }, []);

  const loadGrowthData = async () => {
    try {
      setLoading(true);
      
      // Load user profiles with better error handling
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, created_at, country, updated_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      // Load subscribers with relationship to profiles
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('user_id, created_at, subscribed')
        .eq('subscribed', true);

      if (subscribersError) {
        console.error('Error loading subscribers:', subscribersError);
      }

      if (profilesData) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const newUsersThisMonth = profilesData.filter(profile => {
          const createdDate = new Date(profile.created_at);
          return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;
        
        const newUsersLastMonth = profilesData.filter(profile => {
          const createdDate = new Date(profile.created_at);
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear;
        }).length;
        
        const growthRate = newUsersLastMonth > 0 
          ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
          : newUsersThisMonth > 0 ? 100 : 0;

        // Count users by country with better handling
        const countryCount: { [key: string]: number } = {};
        profilesData.forEach(profile => {
          const country = profile.country || 'Not specified';
          countryCount[country] = (countryCount[country] || 0) + 1;
        });
        
        // Calculate active subscribers more accurately
        const activeSubscribers = subscribersData?.length || 0;
        
        setGrowthData({
          totalUsers: profilesData.length,
          newUsersThisMonth,
          newUsersLastMonth,
          growthRate: Math.max(0, growthRate),
          activeUsers: activeSubscribers,
          usersByCountry: countryCount
        });

        console.log('📊 Growth data loaded:', {
          totalUsers: profilesData.length,
          newUsersThisMonth,
          newUsersLastMonth,
          growthRate,
          activeSubscribers,
          countries: Object.keys(countryCount).length
        });
      }
    } catch (error) {
      console.error('Error loading growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const topCountries = Object.entries(growthData.usersByCountry)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Growth Analytics</h1>
          <p className="text-muted-foreground">Loading growth data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📈 User Growth Analytics</h1>
          <p className="text-muted-foreground">Track user acquisition and growth trends</p>
        </div>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Export Growth Report
        </Button>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-900">{growthData.totalUsers}</p>
                <div className="flex items-center mt-2">
                  <Users className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600">All time</span>
                </div>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">New This Month</p>
                <p className="text-3xl font-bold text-green-900">{growthData.newUsersThisMonth}</p>
                <div className="flex items-center mt-2">
                  <UserPlus className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">
                    {growthData.growthRate > 0 ? '+' : ''}{growthData.growthRate.toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <UserPlus className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active Subscribers</p>
                <p className="text-3xl font-bold text-purple-900">{growthData.activeUsers}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600">
                    {((growthData.activeUsers / growthData.totalUsers) * 100).toFixed(1)}% conversion
                  </span>
                </div>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Growth Rate</p>
                <p className="text-3xl font-bold text-orange-900">
                  {growthData.growthRate > 0 ? '+' : ''}{growthData.growthRate.toFixed(1)}%
                </p>
                <div className="flex items-center mt-2">
                  <BarChart3 className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-sm text-orange-600">Monthly growth</span>
                </div>
              </div>
              <BarChart3 className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts and Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Month</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{growthData.newUsersThisMonth}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Month</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${growthData.newUsersLastMonth > 0 
                          ? (growthData.newUsersLastMonth / Math.max(growthData.newUsersThisMonth, growthData.newUsersLastMonth)) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{growthData.newUsersLastMonth}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {growthData.growthRate > 0 ? '+' : ''}{growthData.growthRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCountries.map(([country, count], index) => (
                <div key={country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-5 rounded flex items-center justify-center text-xs font-medium text-white ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${(count / growthData.totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Growth Insights */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Growth Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
              <UserPlus className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">User Acquisition</h3>
              <p className="text-sm text-green-700">
                {growthData.newUsersThisMonth} new users this month
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-blue-50 border border-blue-200">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 mb-1">Conversion Rate</h3>
              <p className="text-sm text-blue-700">
                {((growthData.activeUsers / growthData.totalUsers) * 100).toFixed(1)}% users become subscribers
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-purple-50 border border-purple-200">
              <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900 mb-1">Global Reach</h3>
              <p className="text-sm text-purple-700">
                Users from {Object.keys(growthData.usersByCountry).length} countries
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}