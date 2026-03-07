import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { TrendingUp, Users, Globe, Activity } from "lucide-react";
import { useRealTimeCustomerData } from "@/hooks/useRealTimeCustomerData";

interface CustomerAnalyticsProps {
  customers: any[];
}

export function CustomerAnalytics({ customers }: CustomerAnalyticsProps) {
  const { data: realTimeData } = useRealTimeCustomerData();
  
  // Process data for analytics
  const countryData = customers.reduce((acc: Record<string, number>, customer: any) => {
    const country = customer.country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryChartData = Object.entries(countryData)
    .map(([country, count]) => ({ country, count: Number(count) }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 6);

  // Subscription status data from real-time data
  const subscriptionData = [
    { name: "Active", value: realTimeData?.subscriptionStatusBreakdown?.active || 0, color: "#22c55e" },
    { name: "Inactive", value: realTimeData?.subscriptionStatusBreakdown?.inactive || 0, color: "#ef4444" },
    { name: "Cancelled", value: realTimeData?.subscriptionStatusBreakdown?.cancelled || 0, color: "#f97316" },
    { name: "Expired", value: realTimeData?.subscriptionStatusBreakdown?.expired || 0, color: "#6b7280" }
  ];

  // Monthly registration data (mock for demo)
  const monthlyData = [
    { month: "Jan", customers: 45 },
    { month: "Feb", customers: 52 },
    { month: "Mar", customers: 48 },
    { month: "Apr", customers: 61 },
    { month: "May", customers: 55 },
    { month: "Jun", customers: 67 }
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {/* Geographic Distribution */}
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Geographic Distribution
          </CardTitle>
          <Badge variant="secondary">
            {Object.keys(countryData).length} countries
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={countryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {countryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {countryChartData.slice(0, 3).map((item, index) => (
              <div key={item.country} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span>{item.country}</span>
                </div>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Subscription Status
          </CardTitle>
          <Badge variant="secondary">
            {customers.length} total
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {subscriptionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Growth */}
      <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Monthly Growth
          </CardTitle>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            +23% avg
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}