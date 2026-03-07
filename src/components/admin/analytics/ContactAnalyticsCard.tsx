import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Clock, TrendingUp } from 'lucide-react';
import { useContactAnalytics, type ContactMetrics } from '@/hooks/useContactAnalytics';

export function ContactAnalyticsCard() {
  const { data: contactData, isLoading, error } = useContactAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Analytics</CardTitle>
          <CardDescription>Loading contact metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !contactData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Analytics</CardTitle>
          <CardDescription>Error loading contact data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Contacts</span>
            </div>
            <div className="text-2xl font-bold mt-2">{contactData.totalContacts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Last 30 Days</span>
            </div>
            <div className="text-2xl font-bold mt-2">{contactData.contactsLast30Days}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Last 7 Days</span>
            </div>
            <div className="text-2xl font-bold mt-2">{contactData.contactsLast7Days}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <div className="text-2xl font-bold mt-2">{contactData.averageResponseTime}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Sources</CardTitle>
          <CardDescription>Where your contacts are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactData.contactsBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="font-medium">{source.source}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{source.count}</span>
                  <Badge variant="secondary">{source.percentage}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}