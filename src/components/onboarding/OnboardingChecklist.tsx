import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOnboardingProgress, OnboardingSteps } from '@/hooks/useOnboardingProgress';
import { 
  User, 
  Phone, 
  Shield, 
  Users, 
  Bell, 
  TestTube, 
  CheckCircle2, 
  Circle,
  Loader2,
  PartyPopper
} from 'lucide-react';
import { toast } from 'sonner';

interface Step {
  key: keyof OnboardingSteps;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const STEPS: Step[] = [
  {
    key: 'complete_profile',
    title: 'Complete Your Profile',
    description: 'Add your personal details and medical information',
    icon: <User className="h-5 w-5" />,
    route: '/member-dashboard/profile',
  },
  {
    key: 'add_emergency_contacts',
    title: 'Add Emergency Contacts',
    description: 'Set up people to notify during emergencies',
    icon: <Phone className="h-5 w-5" />,
    route: '/member-dashboard/profile',
  },
  {
    key: 'configure_sos_settings',
    title: 'Configure SOS Settings',
    description: 'Customize your emergency alert preferences',
    icon: <Shield className="h-5 w-5" />,
    route: '/member-dashboard/family-sos',
  },
  {
    key: 'invite_family',
    title: 'Invite Family Members',
    description: 'Add family members to your safety circle',
    icon: <Users className="h-5 w-5" />,
    route: '/member-dashboard/family-setup',
  },
  {
    key: 'enable_notifications',
    title: 'Enable Notifications',
    description: 'Allow push notifications for real-time alerts',
    icon: <Bell className="h-5 w-5" />,
    route: '/member-dashboard/notifications',
  },
  {
    key: 'run_sos_test',
    title: 'Run SOS Test Simulation',
    description: 'Test your emergency setup with a practice alert',
    icon: <TestTube className="h-5 w-5" />,
    route: '/member-dashboard/family-sos',
  },
];

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { progress, loading, updateStep, markComplete, progressPercentage } = useOnboardingProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedCount = progress ? Object.values(progress.steps).filter(Boolean).length : 0;
  const allComplete = completedCount === 6;

  const handleStart = (step: Step) => {
    navigate(step.route);
  };

  const handleMarkDone = async (step: Step) => {
    await updateStep(step.key, true);
    toast.success(`${step.title} marked as complete!`);
  };

  const handleFinishSetup = async () => {
    await markComplete();
    toast.success('🎉 Onboarding complete! Welcome to LifeLink Sync!');
    navigate('/member-dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to LifeLink Sync!</CardTitle>
          <CardDescription>
            Complete these steps to set up your emergency safety system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={progressPercentage} className="flex-1" />
            <Badge variant={allComplete ? 'default' : 'secondary'}>
              {progressPercentage}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {completedCount} of 6 steps completed
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {STEPS.map((step) => {
          const isComplete = progress?.steps[step.key] ?? false;
          
          return (
            <Card 
              key={step.key} 
              className={isComplete ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-2 rounded-full ${isComplete ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                  {step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{step.title}</h3>
                    {isComplete && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                <div className="flex gap-2">
                  {!isComplete && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStart(step)}
                      >
                        Start
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkDone(step)}
                      >
                        Mark Done
                      </Button>
                    </>
                  )}
                  {isComplete && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Circle className="h-2 w-2 fill-current mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">All Steps Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  You're ready to use LifeLink Sync
                </p>
              </div>
            </div>
            <Button onClick={handleFinishSetup} size="lg">
              Finish Setup
            </Button>
          </CardContent>
        </Card>
      )}

      {!allComplete && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/member-dashboard')}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
        </div>
      )}
    </div>
  );
}
