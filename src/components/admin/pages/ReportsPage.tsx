import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Calendar as CalendarIcon, BarChart3, Users, Activity, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface ReportData {
  id: string;
  name: string;
  type: string;
  description: string;
  lastGenerated?: string;
  status: 'ready' | 'generating' | 'error';
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [generating, setGenerating] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    // Simulated report data - in real implementation, this would come from database
    const reportData: ReportData[] = [
      {
        id: 'user-activity',
        name: 'User Activity Report',
        type: 'activity',
        description: 'Detailed analysis of user interactions and engagement patterns',
        lastGenerated: '2024-01-15T10:30:00Z',
        status: 'ready'
      },
      {
        id: 'revenue-analytics',
        name: 'Revenue Analytics',
        type: 'financial',
        description: 'Comprehensive revenue breakdown by subscription plans and regions',
        lastGenerated: '2024-01-14T15:45:00Z',
        status: 'ready'
      },
      {
        id: 'emergency-incidents',
        name: 'Emergency Incidents Report',
        type: 'safety',
        description: 'Summary of emergency activations and response times',
        lastGenerated: '2024-01-13T09:15:00Z',
        status: 'ready'
      },
      {
        id: 'communication-metrics',
        name: 'Communication Metrics',
        type: 'communication',
        description: 'Email campaigns, chat interactions, and response analytics',
        status: 'ready'
      },
      {
        id: 'ai-performance',
        name: 'AI Performance Report',
        type: 'ai',
        description: 'AI model accuracy, response times, and training effectiveness',
        status: 'ready'
      },
      {
        id: 'system-health',
        name: 'System Health Report',
        type: 'system',
        description: 'Infrastructure performance, uptime, and error rates',
        lastGenerated: '2024-01-15T08:00:00Z',
        status: 'ready'
      }
    ];

    setReports(reportData);
  };

  const generateReport = async (reportId: string) => {
    setGenerating(reportId);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update report status
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, lastGenerated: new Date().toISOString(), status: 'ready' as const }
          : report
      ));
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // Simulate download - in real implementation, this would generate and download actual files
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      // Create a simple CSV content as example
      const csvContent = `Report: ${report.name}\nGenerated: ${new Date().toISOString()}\n\nSample Data:\nMetric,Value\nTotal Users,1250\nActive Sessions,45\nRevenue,€12,450\n`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.id}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'activity': return <Activity className="h-5 w-5" />;
      case 'financial': return <DollarSign className="h-5 w-5" />;
      case 'safety': return <FileText className="h-5 w-5" />;
      case 'communication': return <Users className="h-5 w-5" />;
      case 'ai': return <BarChart3 className="h-5 w-5" />;
      case 'system': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'generating': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download system reports</p>
        </div>
      </div>

      {/* Report Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select a report type and date range to generate new reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map(report => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => selectedReport && generateReport(selectedReport)}
                disabled={!selectedReport || !!generating}
                className="w-full"
              >
                {generating === selectedReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getReportIcon(report.type)}
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                </div>
                <Badge className={`${getStatusColor(report.status)} text-white`}>
                  {report.status}
                </Badge>
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.lastGenerated && (
                <div className="text-sm text-muted-foreground">
                  Last generated: {format(new Date(report.lastGenerated), 'MMM dd, yyyy HH:mm')}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateReport(report.id)}
                  disabled={generating === report.id}
                  className="flex-1"
                >
                  {generating === report.id ? 'Generating...' : 'Regenerate'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => downloadReport(report.id)}
                  disabled={report.status !== 'ready'}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Report Statistics</CardTitle>
          <CardDescription>Overview of report generation and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Available Reports</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Download className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">47</p>
              <p className="text-sm text-muted-foreground">Downloads This Month</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Generated This Week</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">89%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}