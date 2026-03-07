import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Clock, AlertTriangle, CheckCircle, Info, ExternalLink, Settings, Filter, Search, Zap, FileText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  read_at: string | null;
  action_url: string | null;
  action_label: string | null;
  metadata: any;
  created_at: string;
}

export const AdminNotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    const channel = supabase
      .channel('admin_notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admin_notifications' },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);

      if (error) throw error;
      await loadNotifications();
      toast({
        title: "All marked as read",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4";
    switch (category) {
      case 'approval': return <Clock className={iconClass} />;
      case 'campaign': return <Zap className={iconClass} />;
      case 'content': return <FileText className={iconClass} />;
      case 'error': return <AlertTriangle className={iconClass} />;
      case 'user': return <UserPlus className={iconClass} />;
      case 'system': return <Settings className={iconClass} />;
      default: return <Info className={iconClass} />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'approval': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20';
      case 'campaign': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20';
      case 'content': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20';
      case 'error': return 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/20';
      case 'user': return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20';
      case 'system': return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20';
      default: return 'bg-muted text-muted-foreground ring-1 ring-border';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive';
      case 'medium': return 'border-l-amber-500';
      default: return 'border-l-transparent';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'unread' && !notification.read_at) ||
                      (activeTab === 'read' && notification.read_at);
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  const handleNotificationAction = (notification: AdminNotification) => {
    if (!notification.action_url) return;
    markAsRead(notification.id);
    setIsOpen(false);

    if (notification.action_url.startsWith('/')) {
      navigate(notification.action_url);
    } else if (notification.action_url.startsWith('http')) {
      window.open(notification.action_url, '_blank');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 text-[11px] font-semibold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-xl shadow-2xl border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-8 text-xs px-3 gap-1.5"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Tabs & Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-5 py-3 border-b bg-muted/20 space-y-3">
            <TabsList className="h-9 w-full grid grid-cols-3 bg-muted/60 p-1 rounded-lg">
              <TabsTrigger value="all" className="h-7 text-sm rounded-md data-[state=active]:shadow-sm">All</TabsTrigger>
              <TabsTrigger value="unread" className="h-7 text-sm rounded-md data-[state=active]:shadow-sm">Unread</TabsTrigger>
              <TabsTrigger value="read" className="h-7 text-sm rounded-md data-[state=active]:shadow-sm">Read</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-sm bg-background border-border/60"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 w-[110px] text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Bell className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`px-5 py-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer group border-l-2 ${getPriorityStyle(notification.priority)} ${
                        !notification.read_at ? 'bg-primary/[0.04]' : ''
                      }`}
                      onClick={() => notification.action_url && handleNotificationAction(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Category Icon */}
                        <div className={`p-2 rounded-lg shrink-0 ${getCategoryStyle(notification.category)}`}>
                          {getCategoryIcon(notification.category)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium truncate ${!notification.read_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </span>
                            {notification.priority === 'high' && (
                              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-medium">
                                Urgent
                              </Badge>
                            )}
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-primary rounded-full shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] text-muted-foreground/70">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_url && (
                              <span className="text-[11px] text-primary flex items-center gap-1 font-medium hover:underline">
                                <ExternalLink className="h-3 w-3" />
                                {notification.action_label || 'View details'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!notification.read_at && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            title="Delete"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminNotificationCenter;
