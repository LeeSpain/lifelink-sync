import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Brain, TrendingUp, MessageSquare, Target, Clock, Users, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIMetrics {
  totalConversations: number;
  aiResponses: number;
  humanHandovers: number;
  avgResponseTime: number;
  satisfactionScore: number;
  leadConversions: number;
}

interface ConversationData {
  id: string;
  session_id: string;
  user_id?: string;
  status: string;
  created_at: string;
  metadata: any;
  conversation_summary?: string;
  recommended_plan?: string;
  interest_level: number;
}

interface TrainingData {
  id: string;
  input_text: string;
  expected_output: string;
  model_response?: string;
  confidence_score?: number;
  is_correct: boolean;
  created_at: string;
}

const AIPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalConversations: 0,
    aiResponses: 0,
    humanHandovers: 0,
    avgResponseTime: 0,
    satisfactionScore: 0,
    leadConversions: 0
  });
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conversationsRes, leadsRes, trainingRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (conversationsRes.error) throw conversationsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (trainingRes.error) throw trainingRes.error;

      const conversationData = conversationsRes.data || [];
      const leadsData = leadsRes.data || [];
      const trainingDataRes = trainingRes.data || [];

      // Transform leads data to conversation format
      const transformedConversations: ConversationData[] = conversationData.map(lead => ({
        id: lead.id,
        session_id: lead.session_id,
        user_id: lead.user_id || undefined,
        status: lead.status || 'new',
        created_at: lead.created_at,
        metadata: lead.metadata || {},
        conversation_summary: lead.conversation_summary || '',
        recommended_plan: lead.recommended_plan || '',
        interest_level: lead.interest_level || 0
      }));

      // Transform training data
      const transformedTraining: TrainingData[] = trainingDataRes.map(lead => ({
        id: lead.id,
        input_text: 'User inquiry about safety services',
        expected_output: lead.recommended_plan || 'Basic safety plan',
        model_response: lead.conversation_summary || '',
        confidence_score: (lead.interest_level || 0) * 10,
        is_correct: (lead.interest_level || 0) > 5,
        created_at: lead.created_at
      }));

      setConversations(transformedConversations);
      setTrainingData(transformedTraining);

      // Calculate metrics
      const totalConversations = transformedConversations.length;
      const aiResponses = transformedConversations.filter(c => c.status !== 'escalated').length;
      const humanHandovers = transformedConversations.filter(c => c.status === 'escalated').length;
      const leadConversions = leadsData.filter(l => l.status === 'converted').length;
      
      setMetrics({
        totalConversations,
        aiResponses,
        humanHandovers,
        avgResponseTime: 2.3, // Mock data - would be calculated from actual response times
        satisfactionScore: 4.2, // Mock data - would come from user feedback
        leadConversions
      });

    } catch (error: any) {
      toast({
        title: "Error loading AI performance data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const conversationsChannel = supabase
      .channel('leads_changes_ai')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadData();
      })
      .subscribe();

    const leadsChannel = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(leadsChannel);
    };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.conversation_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.session_id.includes(searchTerm)
  );

  const performanceData = {
    responseAccuracy: [
      { date: '2024-01-01', accuracy: 92 },
      { date: '2024-01-02', accuracy: 94 },
      { date: '2024-01-03', accuracy: 91 },
      { date: '2024-01-04', accuracy: 96 },
      { date: '2024-01-05', accuracy: 93 },
      { date: '2024-01-06', accuracy: 95 },
      { date: '2024-01-07', accuracy: 97 }
    ],
    responseTime: [
      { hour: '9AM', avgTime: 1.2 },
      { hour: '10AM', avgTime: 1.8 },
      { hour: '11AM', avgTime: 2.1 },
      { hour: '12PM', avgTime: 2.4 },
      { hour: '1PM', avgTime: 1.9 },
      { hour: '2PM', avgTime: 1.6 },
      { hour: '3PM', avgTime: 2.2 }
    ],
    conversationOutcomes: [
      { name: 'Resolved by AI', value: 65, color: 'hsl(var(--primary))' },
      { name: 'Escalated to Human', value: 20, color: 'hsl(var(--secondary))' },
      { name: 'Converted to Lead', value: 15, color: 'hsl(var(--accent))' }
    ],
    modelPerformance: [
      { model: 'GPT-4', accuracy: 94, speed: 1.2, cost: 0.03 },
      { model: 'GPT-3.5', accuracy: 89, speed: 0.8, cost: 0.002 },
      { model: 'Custom Model', accuracy: 87, speed: 0.6, cost: 0.001 }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'escalated': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInterestLevel = (level: number) => {
    if (level >= 8) return { label: 'High', color: 'bg-green-500' };
    if (level >= 5) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Low', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Performance</h1>
          <p className="text-muted-foreground">Monitor and optimize AI model performance and effectiveness</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTimeRange('24h')}>24h</Button>
          <Button variant="outline" onClick={() => setTimeRange('7d')}>7d</Button>
          <Button variant="outline" onClick={() => setTimeRange('30d')}>30d</Button>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Responses</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.aiResponses}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.aiResponses / metrics.totalConversations) * 100).toFixed(1)}% automation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Handovers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.humanHandovers}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.humanHandovers / metrics.totalConversations) * 100).toFixed(1)}% escalation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              -0.2s from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.satisfactionScore}/5</div>
            <p className="text-xs text-muted-foreground">
              +0.1 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leadConversions}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.leadConversions / metrics.totalConversations) * 100).toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="training">Training Data</TabsTrigger>
          <TabsTrigger value="models">Model Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Accuracy</CardTitle>
                <CardDescription>AI response accuracy over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.responseAccuracy}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>Average response time throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData.responseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgTime" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversation Outcomes</CardTitle>
                <CardDescription>Distribution of conversation results</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData.conversationOutcomes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {performanceData.conversationOutcomes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Progress</CardTitle>
                <CardDescription>Model improvement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Training Accuracy</span>
                    <span className="text-sm text-muted-foreground">94.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '94.2%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data Quality Score</span>
                    <span className="text-sm text-muted-foreground">87.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: '87.5%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Learning Progress</span>
                    <span className="text-sm text-muted-foreground">92.1%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '92.1%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Conversations</CardTitle>
              <CardDescription>Recent AI-handled conversations and their outcomes</CardDescription>
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Interest Level</TableHead>
                    <TableHead>Recommended Plan</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.slice(0, 10).map((conversation) => {
                    const interest = getInterestLevel(conversation.interest_level);
                    return (
                      <TableRow key={conversation.id}>
                        <TableCell className="font-medium">{conversation.session_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`}></div>
                            <span className="capitalize">{conversation.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${interest.color} text-white`}>
                            {interest.label} ({conversation.interest_level}/10)
                          </Badge>
                        </TableCell>
                        <TableCell>{conversation.recommended_plan || 'N/A'}</TableCell>
                        <TableCell>{new Date(conversation.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {conversation.conversation_summary || 'No summary available'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Data Quality</CardTitle>
              <CardDescription>Review and validate AI training data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Training Samples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{trainingData.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Accuracy Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {((trainingData.filter(d => d.is_correct).length / trainingData.length) * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Avg Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {(trainingData.reduce((acc, d) => acc + (d.confidence_score || 0), 0) / trainingData.length).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Input</TableHead>
                    <TableHead>Expected Output</TableHead>
                    <TableHead>Model Response</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingData.slice(0, 10).map((data) => (
                    <TableRow key={data.id}>
                      <TableCell className="max-w-xs truncate">{data.input_text}</TableCell>
                      <TableCell className="max-w-xs truncate">{data.expected_output}</TableCell>
                      <TableCell className="max-w-xs truncate">{data.model_response || 'N/A'}</TableCell>
                      <TableCell>{data.confidence_score ? `${data.confidence_score}%` : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={data.is_correct ? 'default' : 'destructive'}>
                          {data.is_correct ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(data.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
              <CardDescription>Compare different AI models and their effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Accuracy (%)</TableHead>
                    <TableHead>Avg Speed (s)</TableHead>
                    <TableHead>Cost per Request ($)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.modelPerformance.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{model.model}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{model.accuracy}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${model.accuracy}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{model.speed}s</TableCell>
                      <TableCell>${model.cost}</TableCell>
                      <TableCell>
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          {index === 0 ? 'Active' : 'Available'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          {index === 0 ? 'Current' : 'Switch'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPerformancePage;