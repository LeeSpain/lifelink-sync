import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    twilioAPI: HealthCheck;
    openaiAPI: HealthCheck;
    edgeFunctions: HealthCheck;
    overall: HealthCheck;
  };
  version: string;
  uptime: number;
}

const HealthCheckPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/health-check`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('Error fetching health status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchHealthStatus();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchHealthStatus, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warn':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive',
    };

    const colors = {
      healthy: 'bg-green-500 hover:bg-green-600',
      degraded: 'bg-yellow-500 hover:bg-yellow-600',
      unhealthy: 'bg-red-500 hover:bg-red-600',
    };

    return (
      <Badge className={`${colors[status]} text-white`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    return `${ms}ms`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Health Check</h2>
          <p className="text-muted-foreground">
            Monitor the operational status of all critical systems
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
              Auto-refresh (30s)
            </label>
          </div>
          <Button
            onClick={fetchHealthStatus}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Health Check Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall System Status</CardTitle>
                <CardDescription>
                  Last checked: {formatTimestamp(healthData.timestamp)}
                </CardDescription>
              </div>
              {getStatusBadge(healthData.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Activity className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="text-lg font-semibold">{healthData.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Clock className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Check Duration</p>
                  <p className="text-lg font-semibold">{formatResponseTime(healthData.uptime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getStatusIcon(healthData.checks.overall.status)}
                <div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                  <p className="text-lg font-semibold">{healthData.checks.overall.message}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual System Checks */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Database (Supabase)</CardTitle>
                {getStatusIcon(healthData.checks.database.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">
                    {healthData.checks.database.message}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Response Time:</span>
                  <span className="text-sm font-medium">
                    {formatResponseTime(healthData.checks.database.responseTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Checked:</span>
                  <span className="text-sm font-medium">
                    {formatTimestamp(healthData.checks.database.lastChecked)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Twilio API */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Twilio API</CardTitle>
                {getStatusIcon(healthData.checks.twilioAPI.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">
                    {healthData.checks.twilioAPI.message}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Response Time:</span>
                  <span className="text-sm font-medium">
                    {formatResponseTime(healthData.checks.twilioAPI.responseTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Checked:</span>
                  <span className="text-sm font-medium">
                    {formatTimestamp(healthData.checks.twilioAPI.lastChecked)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI API */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">OpenAI API (Clara)</CardTitle>
                {getStatusIcon(healthData.checks.openaiAPI.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">
                    {healthData.checks.openaiAPI.message}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Response Time:</span>
                  <span className="text-sm font-medium">
                    {formatResponseTime(healthData.checks.openaiAPI.responseTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Checked:</span>
                  <span className="text-sm font-medium">
                    {formatTimestamp(healthData.checks.openaiAPI.lastChecked)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edge Functions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Edge Functions</CardTitle>
                {getStatusIcon(healthData.checks.edgeFunctions.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">
                    {healthData.checks.edgeFunctions.message}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Response Time:</span>
                  <span className="text-sm font-medium">
                    {formatResponseTime(healthData.checks.edgeFunctions.responseTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Checked:</span>
                  <span className="text-sm font-medium">
                    {formatTimestamp(healthData.checks.edgeFunctions.lastChecked)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && !healthData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading health status...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Footer */}
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                About Health Checks
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Green (Pass): System is operational and performing well</li>
                <li>Yellow (Warn): System is operational but experiencing degraded performance</li>
                <li>Red (Fail): System is experiencing critical issues</li>
                <li>Checks run every 30 seconds when auto-refresh is enabled</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthCheckPage;
