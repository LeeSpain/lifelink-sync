import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const BetaLaunchBanner = () => {
  const navigate = useNavigate();

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 mb-6">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Sparkles className="h-3 w-3 mr-1" />
            BETA LAUNCH
          </Badge>
          <span className="text-amber-800 dark:text-amber-200">
            You're using the beta version of LifeLink Sync. Emergency services integration is currently in testing phase.
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
          onClick={() => navigate('/beta-disclaimer')}
        >
          Learn More
        </Button>
      </AlertDescription>
    </Alert>
  );
};