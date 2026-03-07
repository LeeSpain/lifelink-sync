import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, DollarSign, Globe, UserCheck, UserX, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { useRealTimeCustomerData } from "@/hooks/useRealTimeCustomerData";

interface CustomerStatsCardsProps {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export function CustomerStatsCards({ 
  totalCustomers, 
  newCustomersThisMonth, 
  activeSubscriptions, 
  totalRevenue 
}: CustomerStatsCardsProps) {
  const { data: realTimeData, isLoading, error } = useRealTimeCustomerData();
  
  // Use real-time data if available, otherwise fall back to props
  const actualTotalCustomers = realTimeData?.totalCustomers ?? totalCustomers;
  const actualNewCustomers = realTimeData?.newCustomersThisMonth ?? newCustomersThisMonth;
  const actualActiveSubscriptions = realTimeData?.activeSubscriptions ?? activeSubscriptions;
  const actualTotalRevenue = realTimeData?.totalRevenue ?? totalRevenue;
  
  const customerGrowthRate = actualNewCustomers > 0 ? 
    ((actualNewCustomers / actualTotalCustomers) * 100).toFixed(1) : "0.0";
  
  const subscriptionRate = actualTotalCustomers > 0 ? 
    ((actualActiveSubscriptions / actualTotalCustomers) * 100).toFixed(1) : "0.0";

  const stats = [
    {
      title: "Total Customers",
      value: isLoading ? "..." : actualTotalCustomers.toLocaleString(),
      icon: Users,
      trend: `+${actualNewCustomers} this month`,
      trendUp: true,
      gradient: "from-primary/20 to-primary/5"
    },
    {
      title: "Monthly Growth",
      value: isLoading ? "..." : `${customerGrowthRate}%`,
      icon: TrendingUp,
      trend: `${actualNewCustomers} new customers`,
      trendUp: actualNewCustomers > 0,
      gradient: "from-emerald-500/20 to-emerald-500/5"
    },
    {
      title: "Active Subscriptions",
      value: isLoading ? "..." : actualActiveSubscriptions.toLocaleString(),
      icon: UserCheck,
      trend: `${subscriptionRate}% conversion rate`,
      trendUp: true,
      gradient: "from-blue-500/20 to-blue-500/5"
    },
    {
      title: "Total Revenue",
      value: isLoading ? "..." : `€${actualTotalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: `€${(realTimeData?.averageRevenuePerCustomer || 0).toFixed(0)} avg per customer`,
      trendUp: true,
      gradient: "from-amber-500/20 to-amber-500/5"
    },
    {
      title: "Premium Subscriptions",
      value: isLoading ? "..." : (realTimeData?.premiumSubscriptions || 0).toLocaleString(),
      icon: Globe,
      trend: `€${realTimeData?.premiumPlanPrice || 9.99}/month tier`,
      trendUp: true,
      gradient: "from-purple-500/20 to-purple-500/5"
    },
    {
      title: "Call Centre Subscriptions",
      value: isLoading ? "..." : (realTimeData?.callCentreSubscriptions || 0).toLocaleString(),
      icon: Shield,
      trend: "€24.99/month tier",
      trendUp: true,
      gradient: "from-cyan-500/20 to-cyan-500/5"
    },
    {
      title: "Inactive Users",
      value: isLoading ? "..." : (actualTotalCustomers - actualActiveSubscriptions).toLocaleString(),
      icon: UserX,
      trend: `${(100 - parseFloat(subscriptionRate)).toFixed(1)}% inactive`,
      trendUp: false,
      gradient: "from-red-500/20 to-red-500/5"
    },
    {
      title: "Conversion Rate",
      value: isLoading ? "..." : `${subscriptionRate}%`,
      icon: AlertTriangle,
      trend: "free to paid conversion",
      trendUp: parseFloat(subscriptionRate) > 0,
      gradient: "from-orange-500/20 to-orange-500/5"
    }
  ];

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-6 mb-8">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load real-time data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              )}
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="flex items-center text-xs">
                <Badge 
                  variant={stat.trendUp ? "default" : "secondary"}
                  className={`text-xs ${stat.trendUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}
                >
                  {isLoading ? "Loading..." : stat.trend}
                </Badge>
              </div>
              {stat.title === "Active Subscriptions" && !isLoading && (
                <Progress 
                  value={parseFloat(subscriptionRate)} 
                  className="mt-3 h-2"
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}