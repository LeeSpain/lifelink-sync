import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, X, Plus, Edit3, Trash2, Database, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  audience?: string;
  tags?: string[];
}

interface TrainingManagerProps {
  title?: string;
  compact?: boolean;
}

const categories = ['general', 'product', 'pricing', 'features', 'support', 'technical'];
const audiences = ['customer', 'internal', 'admin'] as const;

export const TrainingManager: React.FC<TrainingManagerProps> = ({ title = "Clara's Training Data & Knowledge Base", compact = false }) => {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [filteredData, setFilteredData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState<string>('all');

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newAudience, setNewAudience] = useState<'customer' | 'internal' | 'admin'>('customer');
  const [newTags, setNewTags] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editStatus, setEditStatus] = useState('pending');
  const [editAudience, setEditAudience] = useState<'customer' | 'internal' | 'admin'>('customer');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    loadTrainingData();
  }, []);

  useEffect(() => {
    if (audienceFilter === 'all') {
      setFilteredData(trainingData);
    } else {
      setFilteredData(trainingData.filter(item => item.audience === audienceFilter));
    }
  }, [trainingData, audienceFilter]);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTrainingData(data || []);
    } catch (e) {
      console.error('Failed to load training data', e);
      setTrainingData([]);
    } finally {
      setLoading(false);
    }
  };

  const addTrainingData = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    try {
      const tagsArray = newTags.trim() ? newTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const { data, error } = await supabase
        .from('training_data')
        .insert({ 
          question: newQuestion, 
          answer: newAnswer, 
          category: newCategory, 
          audience: newAudience,
          tags: tagsArray,
          status: 'pending' 
        })
        .select()
        .single();
      if (error) throw error;
      setTrainingData([data as TrainingData, ...trainingData]);
      setNewQuestion('');
      setNewAnswer('');
      setNewCategory('general');
      setNewAudience('customer');
      setNewTags('');
    } catch (e) {
      console.error('Failed to add training data', e);
    }
  };

  const startEdit = (item: TrainingData) => {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
    setEditCategory(item.category);
    setEditStatus(item.status);
    setEditAudience((item.audience as 'customer' | 'internal' | 'admin') || 'customer');
    setEditTags(item.tags?.join(', ') || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditCategory('general');
    setEditStatus('pending');
    setEditAudience('customer');
    setEditTags('');
  };

  const saveEdit = async () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return;
    try {
      const tagsArray = editTags.trim() ? editTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const { data, error } = await supabase
        .from('training_data')
        .update({
          question: editQuestion,
          answer: editAnswer,
          category: editCategory,
          status: editStatus,
          audience: editAudience,
          tags: tagsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)
        .select()
        .single();
      if (error) throw error;
      setTrainingData(trainingData.map(td => (td.id === editingId ? (data as TrainingData) : td)));
      cancelEdit();
    } catch (e) {
      console.error('Failed to save training data', e);
    }
  };

  const deleteTrainingData = async (id: string) => {
    try {
      const { error } = await supabase.from('training_data').delete().eq('id', id);
      if (error) throw error;
      setTrainingData(trainingData.filter(td => td.id !== id));
    } catch (e) {
      console.error('Failed to delete training data', e);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('training_data')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setTrainingData(trainingData.map(td => (td.id === id ? (data as TrainingData) : td)));
    } catch (e) {
      console.error('Failed to update status', e);
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

  const getAudienceBadge = (audience?: string) => {
    const audienceValue = audience || 'customer';
    const variants = {
      customer: 'bg-green-100 text-green-800 hover:bg-green-200',
      internal: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      admin: 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return (
      <Badge className={variants[audienceValue as keyof typeof variants] || variants.customer}>
        {audienceValue}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Audience:</label>
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {trainingData.length} entries
          </div>
        </div>

        {/* Add New */}
        {!compact && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question</label>
                <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="What question should Clara answer?" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-2 border rounded-lg">
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Audience</label>
                  <Select value={newAudience} onValueChange={(value: 'customer' | 'internal' | 'admin') => setNewAudience(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <Input 
                  value={newTags} 
                  onChange={(e) => setNewTags(e.target.value)} 
                  placeholder="pricing, emergency, setup (comma-separated)" 
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Answer</label>
                <Textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} rows={4} placeholder="How should Clara respond?" />
              </div>
              <Button onClick={addTrainingData} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Training Example
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="text-center text-muted-foreground py-6">Loading training data...</div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="text-center text-muted-foreground py-6">
                      {trainingData.length === 0 ? "No training data yet. Add your first example above." : "No data matches the current filter."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) =>
                  editingId === item.id ? (
                    <TableRow key={item.id}>
                      <TableCell>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="p-1 border rounded text-xs">
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} className="min-w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} className="min-w-[300px] min-h-[60px]" rows={2} />
                      </TableCell>
                      <TableCell>
                        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="p-1 border rounded text-xs">
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c.charAt(0).toUpperCase() + c.slice(1)}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Select value={editAudience} onValueChange={(value: 'customer' | 'internal' | 'admin') => setEditAudience(value)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={editTags} 
                          onChange={(e) => setEditTags(e.target.value)} 
                          className="min-w-[120px]" 
                          placeholder="tag1, tag2"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">—</div>
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
                            className="cursor-pointer"
                            onClick={() => {
                              const next = item.status === 'active' ? 'pending' : item.status === 'pending' ? 'disabled' : 'active';
                              updateStatus(item.id, next);
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
                          <p className="text-sm text-muted-foreground line-clamp-3">{item.answer}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {getAudienceBadge(item.audience)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.tags && item.tags.length > 0 ? (
                            item.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {item.tags && item.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTrainingData(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TrainingManager;
