import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Send,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Loader2,
  Target,
  Users,
  BarChart3
} from 'lucide-react';

interface SmartSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  contentItems: any[];
}

interface ScheduleSlot {
  time: string;
  platform: string;
  optimal: boolean;
  audience: string;
}

interface BulkScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  startDate: string;
  endDate: string;
  timeSlots: string[];
  platforms: string[];
  distributeEvenly: boolean;
  respectOptimalTimes: boolean;
}

export const SmartContentScheduler: React.FC<SmartSchedulerProps> = ({
  isOpen,
  onClose,
  contentItems
}) => {
  const { toast } = useToast();
  const [scheduleData, setScheduleData] = useState<any>({});
  const [bulkConfig, setBulkConfig] = useState<BulkScheduleConfig>({
    frequency: 'daily',
    interval: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    timeSlots: ['09:00', '14:00', '19:00'],
    platforms: ['facebook', 'instagram'],
    distributeEvenly: true,
    respectOptimalTimes: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);

  // Optimal posting times for different platforms
  const optimalTimes = {
    facebook: ['09:00', '13:00', '15:00'],
    instagram: ['11:00', '14:00', '17:00'],
    twitter: ['08:00', '12:00', '17:00', '19:00'],
    linkedin: ['08:00', '12:00', '14:00'],
    blog: ['10:00', '14:00'],
    email: ['10:00', '14:00', '18:00']
  };

  useEffect(() => {
    if (isOpen) {
      loadSchedule();
    }
  }, [isOpen]);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-scheduler', {
        body: { action: 'get_schedule' }
      });

      if (error) throw error;
      setScheduleData(data.data || {});
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateOptimalSchedule = () => {
    const unscheduledContent = contentItems.filter(item => 
      item.status === 'draft' && selectedContent.includes(item.id)
    );

    if (unscheduledContent.length === 0) {
      toast({
        title: "No Content Selected",
        description: "Please select content to schedule",
        variant: "destructive"
      });
      return;
    }

    const schedule = [];
    let currentDate = new Date(bulkConfig.startDate);
    const endDate = new Date(bulkConfig.endDate);
    
    let contentIndex = 0;
    
    while (currentDate <= endDate && contentIndex < unscheduledContent.length) {
      for (const platform of bulkConfig.platforms) {
        const times = bulkConfig.respectOptimalTimes 
          ? optimalTimes[platform as keyof typeof optimalTimes] || bulkConfig.timeSlots
          : bulkConfig.timeSlots;

        for (const time of times) {
          if (contentIndex >= unscheduledContent.length) break;

          const content = unscheduledContent[contentIndex];
          const scheduledTime = new Date(currentDate);
          const [hours, minutes] = time.split(':').map(Number);
          scheduledTime.setHours(hours, minutes, 0, 0);

          if (scheduledTime > new Date()) {
            schedule.push({
              contentId: content.id,
              title: content.title,
              platform,
              scheduledTime: scheduledTime.toISOString(),
              optimal: bulkConfig.respectOptimalTimes
            });
            contentIndex++;
          }
        }

        if (!bulkConfig.distributeEvenly) break;
      }

      // Move to next interval
      switch (bulkConfig.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + bulkConfig.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * bulkConfig.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + bulkConfig.interval);
          break;
      }
    }

    return schedule;
  };

  const executeBulkSchedule = async () => {
    const schedule = generateOptimalSchedule();
    if (!schedule || schedule.length === 0) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-scheduler', {
        body: {
          action: 'bulk_schedule',
          contentIds: selectedContent,
          bulkScheduleData: bulkConfig
        }
      });

      if (error) throw error;

      toast({
        title: "Bulk Schedule Complete",
        description: `Successfully scheduled ${data.data.scheduled} items`,
      });

      loadSchedule();
      setSelectedContent([]);
    } catch (error) {
      console.error('Error with bulk scheduling:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to execute bulk schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const draftContent = contentItems.filter(item => item.status === 'draft');
  const scheduledItems = Object.values(scheduleData).flat();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Smart Content Scheduler
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bulk Scheduling Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Schedule Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <Select 
                    value={bulkConfig.frequency} 
                    onValueChange={(value: any) => setBulkConfig(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={bulkConfig.startDate}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={bulkConfig.endDate}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Time Slots</Label>
                  <div className="flex gap-2 mt-2">
                    {bulkConfig.timeSlots.map((time, index) => (
                      <Badge key={index} variant="outline">
                        {time}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add time (HH:MM)"
                    className="mt-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const time = e.currentTarget.value;
                        if (time.match(/^\d{2}:\d{2}$/)) {
                          setBulkConfig(prev => ({
                            ...prev,
                            timeSlots: [...prev.timeSlots, time]
                          }));
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>Platforms</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['facebook', 'instagram', 'twitter', 'linkedin'].map(platform => (
                      <label key={platform} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={bulkConfig.platforms.includes(platform)}
                          onChange={(e) => {
                            setBulkConfig(prev => ({
                              ...prev,
                              platforms: e.target.checked
                                ? [...prev.platforms, platform]
                                : prev.platforms.filter(p => p !== platform)
                            }));
                          }}
                        />
                        <span className="capitalize">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkConfig.respectOptimalTimes}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, respectOptimalTimes: e.target.checked }))}
                  />
                  Use optimal posting times
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkConfig.distributeEvenly}
                    onChange={(e) => setBulkConfig(prev => ({ ...prev, distributeEvenly: e.target.checked }))}
                  />
                  Distribute evenly across platforms
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Content Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Content to Schedule ({selectedContent.length} selected)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContent(
                    selectedContent.length === draftContent.length 
                      ? [] 
                      : draftContent.map(item => item.id)
                  )}
                >
                  {selectedContent.length === draftContent.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-auto">
                {draftContent.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedContent.includes(item.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedContent(prev => 
                        prev.includes(item.id)
                          ? prev.filter(id => id !== item.id)
                          : [...prev, item.id]
                      );
                    }}
                  >
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                      <Badge variant="outline" className="text-xs">{item.contentType}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview Schedule */}
          {selectedContent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {generateOptimalSchedule()?.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{item.title}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          → {item.platform}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.scheduledTime).toLocaleString()}
                        {item.optimal && <Badge className="ml-2" variant="outline">Optimal</Badge>}
                      </div>
                    </div>
                  ))}
                  {generateOptimalSchedule()?.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{generateOptimalSchedule()?.length - 10} more items...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={executeBulkSchedule}
              disabled={selectedContent.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule {selectedContent.length} Items
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};