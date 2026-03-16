import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Terminal, GitPullRequest, Clock, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AgentLog {
  id: string;
  command: string;
  status: string;
  pr_url?: string;
  created_at: string;
  response_preview?: string;
}

interface AdminMode {
  current_mode: string;
  mode_set_at: string;
}

export default function DevAgentDashboard() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [mode, setMode] = useState<AdminMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch dev agent logs
      const { data: logData } = await (supabase as any)
        .from('dev_agent_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch current admin mode
      const { data: modeData } = await (supabase as any)
        .from('clara_admin_mode')
        .select('current_mode, mode_set_at')
        .single();

      setLogs(logData || []);
      setMode(modeData || null);
    } catch (err) {
      console.error('Failed to fetch dev agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = async (newMode: string) => {
    try {
      await (supabase as any)
        .from('clara_admin_mode')
        .upsert({ id: 1, current_mode: newMode, mode_set_at: new Date().toISOString() });
      setMode({ current_mode: newMode, mode_set_at: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to switch mode:', err);
    }
  };

  const modes = ['dev', 'business', 'pa', 'planning', 'sales'];
  const todayCount = logs.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const prsRaised = logs.filter(l => l.pr_url).length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'failed': return 'bg-red-500/10 text-red-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const modeColor = (m: string) => {
    switch (m) {
      case 'dev': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'business': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'planning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'sales': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Agent Dashboard</h1>
        <p className="text-muted-foreground">Monitor CLARA dev agent commands, PRs, and mode status</p>
      </div>

      {/* Mode + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Rocket className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Current Mode</p>
                {mode ? (
                  <Badge className={`text-base font-bold ${modeColor(mode.current_mode)}`} variant="outline">
                    /{mode.current_mode}
                  </Badge>
                ) : (
                  <p className="text-lg font-bold">—</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Terminal className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{todayCount}/50</p>
                <p className="text-xs text-muted-foreground">Commands Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GitPullRequest className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{prsRaised}</p>
                <p className="text-xs text-muted-foreground">PRs Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total Commands</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Switcher */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Mode Switch</CardTitle>
          <CardDescription>Switch CLARA admin mode directly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {modes.map(m => (
              <Button
                key={m}
                variant={mode?.current_mode === m ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchMode(m)}
                className={mode?.current_mode === m ? '' : modeColor(m)}
              >
                /{m}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command Log */}
      <Card>
        <CardHeader>
          <CardTitle>Command History</CardTitle>
          <CardDescription>Last 20 commands sent via WhatsApp dev mode</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No commands logged yet</p>
              <p className="text-sm">Commands sent via WhatsApp dev mode will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{log.command}</p>
                    {log.response_preview && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{log.response_preview}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <Badge className={statusColor(log.status)} variant="secondary">
                      {log.status}
                    </Badge>
                    {log.pr_url && (
                      <a href={log.pr_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
