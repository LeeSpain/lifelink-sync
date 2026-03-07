import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, Users, BarChart, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEmailCampaigns } from '@/hooks/useEmailCampaigns';
import { useToast } from '@/hooks/use-toast';

export function EmailManagement() {
  const { 
    campaigns, 
    metrics, 
    loading, 
    loadCampaigns, 
    sendCampaign, 
    queueCampaign, 
    loadMetrics,
    processEmailQueue 
  } = useEmailCampaigns();
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
    loadMetrics();
  }, [loadCampaigns, loadMetrics]);

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await sendCampaign(campaignId);
      toast({
        title: "Campaign Sent",
        description: "Email campaign has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  const handleQueueCampaign = async (campaignId: string) => {
    try {
      await queueCampaign(campaignId);
      toast({
        title: "Campaign Queued",
        description: "Emails have been queued for sending",
      });
    } catch (error) {
      console.error('Error queueing campaign:', error);
    }
  };

  const handleProcessQueue = async () => {
    try {
      await processEmailQueue(20);
    } catch (error) {
      console.error('Error processing queue:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      queued: 'default',
      sending: 'default',
      sent: 'default',
      failed: 'destructive'
    } as const;

    const colors = {
      draft: 'text-gray-600',
      queued: 'text-blue-600',
      sending: 'text-yellow-600',
      sent: 'text-green-600',
      failed: 'text-red-600'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <span className={colors[status as keyof typeof colors]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
          <p className="text-muted-foreground">
            Manage your email campaigns and monitor performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleProcessQueue} variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Process Queue
          </Button>
        </div>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCampaigns}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.emailsSent}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.emailsPending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.openRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>
                Manage and send your email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading campaigns...
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No email campaigns found. Email campaigns are automatically created from your marketing content.
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(campaign.status)}
                          <div className="text-sm text-muted-foreground">
                            {campaign.recipient_count || 0} recipients
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button 
                            onClick={() => handleQueueCampaign(campaign.id)}
                            size="sm"
                            variant="outline"
                          >
                            Queue Emails
                          </Button>
                        )}
                        {(campaign.status === 'draft' || campaign.status === 'queued') && (
                          <Button 
                            onClick={() => handleSendCampaign(campaign.id)}
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Campaign
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>
                Monitor your email campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Emails Sent: {metrics.emailsSent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Pending: {metrics.emailsPending}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Failed: {metrics.emailsFailed}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Open Rate: {metrics.openRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Click Rate: {metrics.clickRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading analytics...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}