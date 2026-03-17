import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Circle, Clock, FileText, Send, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  status: string;
  due_date?: string;
  created_at: string;
}

interface PlanEntry {
  id: string;
  name: string;
  status: string;
  content?: string;
  created_at: string;
}

interface PAAction {
  id: string;
  action_type: string;
  recipient_name?: string;
  recipient_contact?: string;
  message_preview?: string;
  created_at: string;
}

export default function PAModeDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [actions, setActions] = useState<PAAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, plansRes, actionsRes] = await Promise.allSettled([
        (supabase as any).from('clara_tasks').select('*').order('created_at', { ascending: false }).limit(30),
        (supabase as any).from('clara_planning_journal').select('*').order('created_at', { ascending: false }).limit(20),
        (supabase as any).from('clara_pa_actions').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      setTasks(tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []) : []);
      setPlans(plansRes.status === 'fulfilled' ? (plansRes.value.data || []) : []);
      setActions(actionsRes.status === 'fulfilled' ? (actionsRes.value.data || []) : []);
    } catch (err) {
      console.error('Failed to fetch PA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const { data } = await (supabase as any)
        .from('clara_tasks')
        .insert({ title: newTask.trim(), status: 'pending' })
        .select()
        .single();
      if (data) setTasks(prev => [data, ...prev]);
      setNewTask('');
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await (supabase as any).from('clara_tasks').update({ status: newStatus }).eq('id', id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed').slice(0, 10);

  const planStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return 'bg-blue-500/10 text-blue-500';
      case 'complete': return 'bg-green-500/10 text-green-500';
      case 'saved': return 'bg-purple-500/10 text-purple-500';
      case 'draft': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const actionIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return '📱';
      case 'email': return '📧';
      case 'task': return '✅';
      case 'research': return '🔍';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-8 py-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PA Dashboard</h1>
        <p className="text-muted-foreground">Tasks, planning journal, and PA actions log</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Tasks
            </CardTitle>
            <CardDescription>{pendingTasks.length} pending, {completedTasks.length} completed recently</CardDescription>
          </CardHeader>
          <CardContent className="px-8 py-6 w-full space-y-4">
            {/* Add task */}
            <div className="flex gap-2">
              <Input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Add a new task..."
                className="flex-1"
              />
              <Button onClick={addTask} size="sm" disabled={!newTask.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Pending */}
            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Pending</p>
                {pendingTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <button onClick={() => toggleTask(t.id, t.status)}>
                      <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </button>
                    <span className="text-sm flex-1">{t.title}</span>
                    {t.due_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(t.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Completed */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Completed</p>
                {completedTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg opacity-60">
                    <button onClick={() => toggleTask(t.id, t.status)}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </button>
                    <span className="text-sm flex-1 line-through">{t.title}</span>
                  </div>
                ))}
              </div>
            )}

            {pendingTasks.length === 0 && completedTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No tasks yet. Add one above or let CLARA create them via PA mode.</p>
            )}
          </CardContent>
        </Card>

        {/* Planning Journal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Planning Journal
            </CardTitle>
            <CardDescription>{plans.length} plans</CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No plans created yet</p>
            ) : (
              <div className="space-y-3">
                {plans.map(p => (
                  <div key={p.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{p.name}</p>
                      <Badge className={planStatusColor(p.status)} variant="secondary">{p.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                    {p.content && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PA Actions Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              PA Actions Log
            </CardTitle>
            <CardDescription>Last 20 actions taken by CLARA PA</CardDescription>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No PA actions recorded yet</p>
            ) : (
              <div className="space-y-3">
                {actions.map(a => (
                  <div key={a.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span>{actionIcon(a.action_type)}</span>
                      <span className="text-xs font-medium uppercase text-muted-foreground">{a.action_type}</span>
                    </div>
                    {a.recipient_name && (
                      <p className="text-sm mt-1">
                        To: <span className="font-medium">{a.recipient_name}</span>
                        {a.recipient_contact && <span className="text-muted-foreground"> ({a.recipient_contact})</span>}
                      </p>
                    )}
                    {a.message_preview && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message_preview}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
