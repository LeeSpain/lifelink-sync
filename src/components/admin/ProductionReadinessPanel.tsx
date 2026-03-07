import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Rocket, 
  Database,
  CreditCard,
  Shield,
  FileText,
  BarChart3
} from 'lucide-react';

interface SetupResults {
  database: boolean;
  stripe: boolean;
  security: boolean;
  content: boolean;
  analytics: boolean;
}

interface ProductionStatus {
  readinessScore: number;
  setupResults: SetupResults;
  recommendations: string[];
  timestamp: string;
}

export const ProductionReadinessPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ProductionStatus | null>(null);
  const { toast } = useToast();

  const checkProductionReadiness = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-production-environment');
      
      if (error) {
        throw new Error(error.message);
      }

      setStatus(data);
      
      toast({
        title: "Production Check Complete",
        description: `System is ${data.readinessScore.toFixed(1)}% ready for production`,
      });
    } catch (error) {
      console.error('Production readiness check failed:', error);
      toast({
        title: "Check Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (isReady: boolean) => {
    return isReady ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-destructive" />
    );
  };

  const getReadinessColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const setupItems = [
    { key: 'database', label: 'Database Setup', icon: Database },
    { key: 'stripe', label: 'Payment Processing', icon: CreditCard },
    { key: 'security', label: 'Security Configuration', icon: Shield },
    { key: 'content', label: 'Legal Content', icon: FileText },
    { key: 'analytics', label: 'Analytics Setup', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Production Readiness Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={checkProductionReadiness}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking Production Readiness...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Run Production Readiness Check
              </>
            )}
          </Button>

          {status && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getReadinessColor(status.readinessScore)}`}>
                  {status.readinessScore.toFixed(1)}% Ready
                </div>
                <Progress value={status.readinessScore} className="mt-2" />
              </div>

              <div className="grid gap-3">
                {setupItems.map(item => {
                  const isReady = status.setupResults[item.key as keyof SetupResults];
                  const Icon = item.icon;
                  
                  return (
                    <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(isReady)}
                        <Badge variant={isReady ? "default" : "destructive"}>
                          {isReady ? "Ready" : "Needs Setup"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {status.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {status.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="text-xs text-muted-foreground text-center">
                Last checked: {new Date(status.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Launch Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="font-medium">For Beta Launch (Ready Now):</div>
            <ul className="text-xs space-y-1 text-muted-foreground ml-4">
              <li>• Deploy current version with emergency disclaimers</li>
              <li>• Start with 100-500 beta users in Spain</li>
              <li>• Enable subscription payments</li>
              <li>• Monitor user feedback and performance</li>
            </ul>
          </div>

          <div className="text-sm space-y-2">
            <div className="font-medium">For Full Production (2-4 weeks):</div>
            <ul className="text-xs space-y-1 text-muted-foreground ml-4">
              <li>• Integrate real emergency dispatch centers</li>
              <li>• Complete mobile app development</li>
              <li>• Finalize production infrastructure</li>
              <li>• Launch marketing campaigns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionReadinessPanel;