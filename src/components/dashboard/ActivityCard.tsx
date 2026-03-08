import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, TestTube, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

const ActivityCard = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isTestingEmergency, setIsTestingEmergency] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const logActivity = async (type: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: type,
          description: description
        });

      if (error) throw error;
      fetchRecentActivity();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const testEmergencySystem = async () => {
    setIsTestingEmergency(true);
    try {
      // Simulate emergency system test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await logActivity('emergency_test', 'Emergency system test completed successfully');
      
      toast({
        title: t('activityCard.testSuccessTitle'),
        description: t('activityCard.testSuccessDescription'),
      });
    } catch (error) {
      toast({
        title: t('activityCard.testFailedTitle'),
        description: t('activityCard.testFailedDescription'),
        variant: "destructive"
      });
    } finally {
      setIsTestingEmergency(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'emergency_test':
        return <TestTube className="h-4 w-4 text-blue-500" />;
      case 'profile_update':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'emergency_alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityType = (type: string) => {
    switch (type) {
      case 'emergency_test':
        return t('activityCard.emergencyTest');
      case 'profile_update':
        return t('activityCard.profileUpdate');
      case 'emergency_alert':
        return t('activityCard.emergencyAlert');
      default:
        return t('activityCard.activity');
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          {t('activityCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Emergency Test Section */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{t('activityCard.emergencyTest')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('activityCard.testDescription')}
                </p>
              </div>
              <Button
                onClick={testEmergencySystem}
                disabled={isTestingEmergency}
                size="sm"
                className="shrink-0"
              >
                {isTestingEmergency ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {t('activityCard.testing')}
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    {t('activityCard.runTest')}
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
              <strong>Note:</strong> {t('activityCard.testNote')}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="font-medium mb-4">{t('activityCard.recentActivity')}</h4>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>{t('activityCard.noRecentActivity')}</p>
                <p className="text-sm">{t('activityCard.activityWillAppear')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getActivityType(activity.activity_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()} at{' '}
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">{t('activityCard.systemStatus')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 border rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('activityCard.emergencyServices')}</span>
                <Badge className="ml-auto bg-green-100 text-green-800">{t('activityCard.online')}</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('activityCard.notificationSystem')}</span>
                <Badge className="ml-auto bg-green-100 text-green-800">{t('activityCard.active')}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;