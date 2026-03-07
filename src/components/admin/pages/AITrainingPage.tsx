import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Brain, 
  FileText, 
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface TrainingData {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  confidence_score?: number;
  usage_count?: number;
  last_used_at?: string;
  created_by?: string;
}

export default function AITrainingPage() {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editStatus, setEditStatus] = useState('pending');
  const [testMessage, setTestMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const { toast } = useToast();

  // Now using real database operations with training_data table

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrainingData(data || []);
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTrainingData = async () => {
    if (!newQuestion || !newAnswer) return;

    try {
      const { data, error } = await supabase
        .from('training_data')
        .insert({
          question: newQuestion,
          answer: newAnswer,
          category: newCategory,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setTrainingData([data, ...trainingData]);
      setNewQuestion('');
      setNewAnswer('');
      setNewCategory('general');
    } catch (error) {
      console.error('Error adding training data:', error);
    }
  };

  const deleteTrainingData = async (id: string) => {
    try {
      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTrainingData(trainingData.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting training data:', error);
    }
  };

  const startEdit = (item: TrainingData) => {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
    setEditCategory(item.category);
    setEditStatus(item.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditCategory('general');
    setEditStatus('pending');
  };

  const saveEdit = async () => {
    if (!editingId || !editQuestion || !editAnswer) return;

    try {
      const { data, error } = await supabase
        .from('training_data')
        .update({
          question: editQuestion,
          answer: editAnswer,
          category: editCategory,
          status: editStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)
        .select()
        .single();

      if (error) throw error;

      setTrainingData(trainingData.map(item => 
        item.id === editingId ? data : item
      ));
      
      cancelEdit();
    } catch (error) {
      console.error('Error updating training data:', error);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('training_data')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTrainingData(trainingData.map(item => 
        item.id === id ? data : item
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const testClaraConnection = async () => {
    if (!testMessage.trim()) return;

    try {
      setTestLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: testMessage,
          sessionId: `admin-test-${Date.now()}`,
          userId: null,
          context: 'admin-training-test'
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Clara Connection Test Successful",
        description: `Clara responded: "${data.response?.slice(0, 100)}..."`,
      });

      setTestMessage('');
    } catch (error) {
      console.error('Error testing Clara:', error);
      toast({
        title: "❌ Clara Connection Test Failed",
        description: "Unable to connect to Clara. Check the AI Chat edge function.",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'disabled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'disabled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const categories = ['general', 'product', 'pricing', 'features', 'support', 'technical'];
  const stats = {
    total: trainingData.length,
    active: trainingData.filter(item => item.status === 'active').length,
    pending: trainingData.filter(item => item.status === 'pending').length,
    categories: categories.length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Training Data</h1>
          <p className="text-muted-foreground">Loading training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎓 AI Training Data</h1>
          <p className="text-muted-foreground">Manage Clara's knowledge base and training examples</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Training Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Examples</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Categories</p>
                <p className="text-2xl font-bold text-purple-900">{stats.categories}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Training Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Training Example
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question</label>
                <Input 
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="What question should Clara be able to answer?"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Answer</label>
                <Textarea 
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="How should Clara respond to this question?"
                  rows={4}
                />
              </div>
              
                <Button onClick={addTrainingData} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Example
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Training Examples ({trainingData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainingData.map((item) => 
                  editingId === item.id ? (
                   <TableRow key={item.id}>
                     <TableCell>
                       <select 
                         value={editStatus}
                         onChange={(e) => setEditStatus(e.target.value)}
                         className="p-1 border rounded text-xs"
                       >
                         <option value="pending">Pending</option>
                         <option value="active">Active</option>
                         <option value="disabled">Disabled</option>
                       </select>
                     </TableCell>
                     <TableCell>
                       <Input
                         value={editQuestion}
                         onChange={(e) => setEditQuestion(e.target.value)}
                         className="min-w-[200px]"
                       />
                     </TableCell>
                     <TableCell>
                       <Textarea
                         value={editAnswer}
                         onChange={(e) => setEditAnswer(e.target.value)}
                         className="min-w-[300px] min-h-[60px]"
                         rows={2}
                       />
                     </TableCell>
                     <TableCell>
                       <select 
                         value={editCategory}
                         onChange={(e) => setEditCategory(e.target.value)}
                         className="p-1 border rounded text-xs"
                       >
                         {categories.map(category => (
                           <option key={category} value={category}>
                             {category.charAt(0).toUpperCase() + category.slice(1)}
                           </option>
                         ))}
                       </select>
                     </TableCell>
                     <TableCell>
                       <div className="text-center text-sm text-muted-foreground">
                         Editing...
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="text-sm text-muted-foreground">
                         {new Date(item.updated_at).toLocaleDateString()}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="flex gap-1">
                         <Button variant="outline" size="sm" onClick={saveEdit}>
                           <CheckCircle className="h-3 w-3" />
                         </Button>
                         <Button variant="outline" size="sm" onClick={cancelEdit}>
                           <X className="h-3 w-3" />
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ) : (
                   <TableRow key={item.id}>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         {getStatusIcon(item.status)}
                         <Badge 
                           className={`${getStatusColor(item.status)} cursor-pointer`}
                           onClick={() => {
                             const newStatus = item.status === 'active' ? 'pending' : 
                                             item.status === 'pending' ? 'disabled' : 'active';
                             updateStatus(item.id, newStatus);
                           }}
                         >
                           {item.status}
                         </Badge>
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="max-w-xs">
                         <p className="font-medium truncate">{item.question}</p>
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="max-w-md">
                         <p className="text-sm text-muted-foreground line-clamp-2">
                           {item.answer}
                         </p>
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline">
                         {item.category}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <div className="text-center">
                         <div className="text-sm font-medium">{item.usage_count || 0}</div>
                         {item.last_used_at && (
                           <div className="text-xs text-muted-foreground">
                             {new Date(item.last_used_at).toLocaleDateString()}
                           </div>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="text-sm text-muted-foreground">
                         {new Date(item.updated_at).toLocaleDateString()}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => startEdit(item)}
                         >
                           <Edit className="h-3 w-3" />
                         </Button>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => deleteTrainingData(item.id)}
                         >
                           <Trash2 className="h-3 w-3" />
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Test Clara Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Test Clara Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test if Clara can use the training data you've added. Try asking a question that should be covered by your training examples.
            </p>
            <div className="flex gap-2">
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Ask Clara a question to test the training data..."
                onKeyPress={(e) => e.key === 'Enter' && testClaraConnection()}
                disabled={testLoading}
              />
              <Button 
                onClick={testClaraConnection}
                disabled={!testMessage.trim() || testLoading}
              >
                {testLoading ? 'Testing...' : 'Test Clara'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Training Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg bg-blue-50 border border-blue-200">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 mb-1">Most Used</h3>
              <p className="text-sm text-blue-700">
                {trainingData
                  .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))[0]?.question?.slice(0, 30) + "..." || "No data yet"}
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">Active Training</h3>
              <p className="text-sm text-green-700">{stats.active} examples ready for Clara</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-900 mb-1">Needs Review</h3>
              <p className="text-sm text-yellow-700">{stats.pending} examples pending approval</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}