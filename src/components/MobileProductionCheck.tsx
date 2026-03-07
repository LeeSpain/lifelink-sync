import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Smartphone, Globe, Shield, Database, Zap } from 'lucide-react';
import { performProductionReadinessCheck, ProductionReadinessReport } from '@/utils/productionReadiness';

export const MobileProductionCheck: React.FC = () => {
  const [report, setReport] = useState<ProductionReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const result = await performProductionReadinessCheck();
      setReport(result);
    } catch (error) {
      console.error('Production check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Payment Processing':
        return <Zap className="h-4 w-4" />;
      case 'Emergency Services':
        return <Shield className="h-4 w-4" />;
      case 'Mobile Application':
        return <Smartphone className="h-4 w-4" />;
      case 'Security':
        return <Shield className="h-4 w-4" />;
      case 'Database Performance':
        return <Database className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Production Readiness Check
          </CardTitle>
          <CardDescription>
            Verifying system readiness for production deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runCheck} disabled={loading}>
            {loading ? 'Running Checks...' : 'Start Production Check'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Production Readiness Score
            </span>
            <Badge variant={report.percentage >= 90 ? 'default' : report.percentage >= 70 ? 'secondary' : 'destructive'}>
              {report.percentage}%
            </Badge>
          </CardTitle>
          <CardDescription>
            {report.score} out of {report.maxScore} checks passed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                report.percentage >= 90 ? 'bg-green-500' : 
                report.percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${report.percentage}%` }}
            />
          </div>
          
          {report.percentage >= 90 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">🎉 Ready for Production!</p>
              <p className="text-green-700 text-sm">All critical systems are operational.</p>
            </div>
          )}
          
          {report.percentage < 90 && report.percentage >= 70 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 font-medium">⚠️ Almost Ready</p>
              <p className="text-yellow-700 text-sm">Minor issues need attention before production.</p>
            </div>
          )}
          
          {report.percentage < 70 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-800 font-medium">❌ Not Ready for Production</p>
              <p className="text-red-700 text-sm">Critical issues must be resolved first.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Checks */}
      <Card>
        <CardHeader>
          <CardTitle>System Checks</CardTitle>
          <CardDescription>Detailed breakdown of production readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.checks.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getCategoryIcon(check.category)}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium">{check.category}</h4>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                    {check.action && (
                      <p className="text-xs text-blue-600 mt-1">
                        Action: {check.action}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusIcon(check.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      {report.criticalIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Critical Issues</CardTitle>
            <CardDescription>These must be resolved before production deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.criticalIssues.map((issue, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-800">{issue.category}</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{issue.message}</p>
                  {issue.action && (
                    <p className="text-red-600 text-xs mt-2 font-medium">
                      → {issue.action}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Actions */}
      {report.recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
            <CardDescription>Steps to improve production readiness</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={runCheck} disabled={loading} variant="outline">
          {loading ? 'Checking...' : 'Re-run Check'}
        </Button>
      </div>
    </div>
  );
};