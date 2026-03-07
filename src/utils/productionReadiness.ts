// Production readiness utilities

export interface ProductionCheckResult {
  category: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  action?: string;
}

export interface ProductionReadinessReport {
  score: number;
  maxScore: number;
  percentage: number;
  checks: ProductionCheckResult[];
  criticalIssues: ProductionCheckResult[];
  recommendedActions: string[];
}

export const performProductionReadinessCheck = async (): Promise<ProductionReadinessReport> => {
  const checks: ProductionCheckResult[] = [];

  // 1. Stripe Configuration
  try {
    const response = await fetch('/api/stripe/config-check');
    if (response.ok) {
      checks.push({
        category: 'Payment Processing',
        status: 'pass',
        message: 'Stripe production configuration verified'
      });
    } else {
      checks.push({
        category: 'Payment Processing',
        status: 'fail',
        message: 'Stripe production keys not configured',
        action: 'Configure production Stripe keys in Supabase secrets'
      });
    }
  } catch (error) {
    checks.push({
      category: 'Payment Processing',
      status: 'fail',
      message: 'Cannot verify payment system configuration',
      action: 'Check Stripe configuration and network connectivity'
    });
  }

  // 2. Emergency Services
  const emergencyServiceCheck = checkEmergencyServices();
  checks.push(emergencyServiceCheck);

  // 3. Mobile App Readiness
  const mobileAppCheck = checkMobileAppReadiness();
  checks.push(mobileAppCheck);

  // 4. Security Configuration
  const securityCheck = await checkSecurityConfiguration();
  checks.push(securityCheck);

  // 5. Database Performance
  const dbCheck = await checkDatabasePerformance();
  checks.push(dbCheck);

  // Calculate scores
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  
  const score = passCount * 2 + warnCount * 1 + failCount * 0;
  const maxScore = checks.length * 2;
  const percentage = Math.round((score / maxScore) * 100);

  const criticalIssues = checks.filter(c => c.status === 'fail');
  
  const recommendedActions = [
    ...criticalIssues.map(issue => issue.action || `Fix: ${issue.message}`),
    ...(percentage < 90 ? ['Complete all security configurations', 'Test all emergency workflows'] : [])
  ].filter(Boolean);

  return {
    score,
    maxScore,
    percentage,
    checks,
    criticalIssues,
    recommendedActions
  };
};

const checkEmergencyServices = (): ProductionCheckResult => {
  // In production, this would check actual emergency service integration
  return {
    category: 'Emergency Services',
    status: 'warn',
    message: 'Emergency services integration needs validation',
    action: 'Test and validate emergency service partnerships'
  };
};

const checkMobileAppReadiness = (): ProductionCheckResult => {
  // Check if Capacitor is properly configured
  const hasCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;
  
  if (hasCapacitor) {
    return {
      category: 'Mobile Application',
      status: 'pass',
      message: 'Mobile app configuration detected'
    };
  }
  
  return {
    category: 'Mobile Application',
    status: 'warn',
    message: 'Mobile app needs to be built and deployed',
    action: 'Build and submit mobile apps to app stores'
  };
};

const checkSecurityConfiguration = async (): Promise<ProductionCheckResult> => {
  try {
    // This would typically check for security headers, HTTPS, etc.
    const isHTTPS = window.location.protocol === 'https:';
    
    if (isHTTPS) {
      return {
        category: 'Security',
        status: 'pass',
        message: 'HTTPS and basic security configured'
      };
    }
    
    return {
      category: 'Security',
      status: 'fail',
      message: 'HTTPS not configured',
      action: 'Ensure HTTPS is enabled in production'
    };
  } catch (error) {
    return {
      category: 'Security',
      status: 'warn',
      message: 'Cannot verify security configuration',
      action: 'Review security settings'
    };
  }
};

const checkDatabasePerformance = async (): Promise<ProductionCheckResult> => {
  try {
    const startTime = Date.now();
    
    // Simple connectivity check
    const response = await fetch('/api/health-check');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (responseTime < 500) {
      return {
        category: 'Database Performance',
        status: 'pass',
        message: `Database response time: ${responseTime}ms`
      };
    } else if (responseTime < 1000) {
      return {
        category: 'Database Performance',
        status: 'warn',
        message: `Database response time: ${responseTime}ms (acceptable but could be optimized)`,
        action: 'Consider database optimization'
      };
    } else {
      return {
        category: 'Database Performance',
        status: 'fail',
        message: `Database response time: ${responseTime}ms (too slow)`,
        action: 'Optimize database queries and configuration'
      };
    }
  } catch (error) {
    return {
      category: 'Database Performance',
      status: 'fail',
      message: 'Cannot connect to database',
      action: 'Check database connectivity and configuration'
    };
  }
};