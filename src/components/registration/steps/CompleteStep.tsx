import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Shield, Users, Phone, Bell } from 'lucide-react';

interface CompleteStepProps {
  firstName: string;
  isTrialSelected: boolean;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ firstName, isTrialSelected }) => {
  return (
    <div className="text-center space-y-8 max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-wellness/10">
          <CheckCircle className="h-10 w-10 text-wellness" />
        </div>
        <h2 className="text-3xl font-poppins font-bold text-foreground">
          You're All Set{firstName ? `, ${firstName}` : ''}!
        </h2>
        <p className="text-muted-foreground">
          {isTrialSelected
            ? 'Your 7-day free trial is now active. Explore all the features and stay protected.'
            : 'Your account is active and your protection is live. Welcome to the LifeLink Sync family.'
          }
        </p>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <Badge className="bg-wellness/10 text-wellness border-wellness/20 px-3 py-1">
          <Shield className="h-3 w-3 mr-1.5" />
          Account Active
        </Badge>
        {isTrialSelected ? (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
            7-Day Trial Started
          </Badge>
        ) : (
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            Payment Confirmed
          </Badge>
        )}
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
          Profile Complete
        </Badge>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {[
          { icon: Shield, title: 'Test SOS', desc: 'Try your emergency button in safe mode' },
          { icon: Users, title: 'Check Circles', desc: 'See your family connections' },
          { icon: Phone, title: 'Review Contacts', desc: 'Verify emergency contact details' },
          { icon: Bell, title: 'Notifications', desc: 'Configure your alert preferences' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button asChild size="lg" className="px-10">
        <Link to="/member-dashboard">
          Go to Your Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>

      {/* Support */}
      <p className="text-xs text-muted-foreground">
        Need help? Contact us at{' '}
        <a href="mailto:support@lifelink-sync.com" className="text-primary hover:underline">
          support@lifelink-sync.com
        </a>
      </p>
    </div>
  );
};

export default CompleteStep;
