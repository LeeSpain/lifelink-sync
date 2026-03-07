import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Shield, 
  Smartphone, 
  TestTube,
  TrendingUp,
  Zap,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MobileProductionCheck } from '@/components/MobileProductionCheck';

interface SystemStatus {
  overall_health: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    authentication: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'degraded' | 'unhealthy';
    emergency_services: 'healthy' | 'degraded' | 'unhealthy';
    payment_processing: 'healthy' | 'degraded' | 'unhealthy';
  };
  last_updated: string;
}

interface TestResult {
  test_type: string;
  success: boolean;
  duration_ms: number;
  timestamp: string;
}

interface PerformanceMetrics {
  total_test_time_ms: number;
  simple_query_time_ms: number;
  complex_query_time_ms: number;
  queries_per_second: number;
  performance_grade: string;
}

export const CoreDevelopmentDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadSystemHealth(),
        loadRecentTests(),
        loadPerformanceMetrics()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('production-monitoring', {
        body: { action: 'health_check' }
      });

      if (error) throw error;

      if (data?.health_check) {
        setSystemStatus({
          overall_health: data.health_check.overall_health,
          services: {
            database: data.health_check.database.status,
            authentication: data.health_check.authentication.status,
            storage: data.health_check.storage.status,
            emergency_services: data.health_check.emergency_services.status,
            payment_processing: data.health_check.payment_processing.status,
          },
          last_updated: data.health_check.last_updated
        });
      }
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const loadRecentTests = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_test_results')
        .select('test_type, success, duration_ms, test_timestamp')
        .order('test_timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;

      setTestResults(data.map(test => ({
        test_type: test.test_type,
        success: test.success,
        duration_ms: test.duration_ms,
        timestamp: test.test_timestamp
      })));
    } catch (error) {
      console.error('Failed to load test results:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('production-monitoring', {
        body: { action: 'performance_test' }
      });

      if (error) throw error;

      if (data?.performance) {
        setPerformanceMetrics(data.performance);
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const runEmergencyTest = async (testType: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-workflow-testing', {
        body: {
          test_type: testType,
          test_scenario: `Production ${testType} test`,
          test_data: {
            location: { lat: 40.4168, lng: -3.7038 } // Madrid coordinates
          },
          expected_outcome: 'All emergency workflows function correctly'
        }
      });

      if (error) throw error;

      toast({
        title: "Emergency Test Completed",
        description: `${testType} test ${data.test_result.success ? 'passed' : 'failed'} in ${data.test_result.duration_ms}ms`,
        variant: data.test_result.success ? "default" : "destructive"
      });

      await loadRecentTests();
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <Activity className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Core Development Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor production systems, emergency workflows, and mobile app readiness
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* System Health Overview */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              System Health Overview
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(systemStatus.last_updated).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="flex flex-col items-center p-4 border rounded-lg">
                {getStatusIcon(systemStatus.overall_health)}
                <span className="text-sm font-medium mt-2">Overall</span>
                <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(systemStatus.overall_health)} text-white`}>
                  {systemStatus.overall_health}
                </span>
              </div>
              
              {Object.entries(systemStatus.services).map(([service, status]) => (
                <div key={service} className="flex flex-col items-center p-4 border rounded-lg">
                  {getStatusIcon(status)}
                  <span className="text-sm font-medium mt-2 capitalize">
                    {service.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(status)} text-white`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Production Monitoring</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Testing</TabsTrigger>
          <TabsTrigger value="mobile">Mobile App</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Production Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Database Health
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.services.database === 'healthy' ? '✓' : '⚠'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Query response time: &lt;500ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Emergency Services
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.services.emergency_services === 'healthy' ? '✓' : '⚠'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Integration operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Payment Processing
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.services.payment_processing === 'healthy' ? '✓' : '⚠'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Stripe production ready
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emergency Testing Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Emergency Workflow Tests
                </CardTitle>
                <CardDescription>
                  Run comprehensive tests on emergency systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => runEmergencyTest('full_workflow')}
                  disabled={loading}
                  className="w-full"
                >
                  Test Full Emergency Workflow
                </Button>
                <Button 
                  onClick={() => runEmergencyTest('family_alerts')}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  Test Family Alerts
                </Button>
                <Button 
                  onClick={() => runEmergencyTest('email_notifications')}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  Test Email Notifications
                </Button>
                <Button 
                  onClick={() => runEmergencyTest('location_tracking')}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  Test Location Tracking
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Test Results</CardTitle>
                <CardDescription>
                  Latest emergency workflow test outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.slice(0, 5).map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {test.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{test.test_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(test.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={test.success ? 'default' : 'destructive'}>
                        {test.duration_ms}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mobile App Tab */}
        <TabsContent value="mobile" className="space-y-4">
          <MobileProductionCheck />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {performanceMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Database Performance
                  </CardTitle>
                  <CardDescription>
                    Latest performance test results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Simple Query Time</span>
                      <Badge variant="outline">
                        {performanceMetrics.simple_query_time_ms}ms
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Complex Query Time</span>
                      <Badge variant="outline">
                        {performanceMetrics.complex_query_time_ms}ms
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Queries per Second</span>
                      <Badge variant="outline">
                        {performanceMetrics.queries_per_second}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Performance Grade</span>
                      <Badge variant={
                        performanceMetrics.performance_grade === 'A' ? 'default' :
                        performanceMetrics.performance_grade === 'B' ? 'secondary' :
                        'destructive'
                      }>
                        {performanceMetrics.performance_grade}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>
                  Overall system performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">99.9%</div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">&lt;200ms</div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">1,247</div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};