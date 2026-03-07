import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Edit,
  FileText,
  Image,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const TrainingDataManager: React.FC = () => {
  const [datasets, setDatasets] = useState([
    { 
      id: '1', 
      name: 'Family Safety Content', 
      type: 'text', 
      size: '2.4 MB', 
      samples: 450, 
      status: 'active',
      lastUpdated: '2 days ago'
    },
    { 
      id: '2', 
      name: 'Emergency Scenarios', 
      type: 'text', 
      size: '1.8 MB', 
      samples: 320, 
      status: 'training',
      lastUpdated: '1 hour ago'
    },
    { 
      id: '3', 
      name: 'Safety Image Library', 
      type: 'image', 
      size: '15.2 MB', 
      samples: 890, 
      status: 'active',
      lastUpdated: '5 days ago'
    },
    { 
      id: '4', 
      name: 'Customer Testimonials', 
      type: 'text', 
      size: '900 KB', 
      samples: 125, 
      status: 'pending',
      lastUpdated: '3 days ago'
    }
  ]);

  const [isAddingDataset, setIsAddingDataset] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: '',
    type: 'text',
    description: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'training': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return FileText;
      case 'image': return Image;
      case 'mixed': return Database;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Training Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Datasets</p>
                <p className="text-2xl font-bold">{datasets.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Samples</p>
                <p className="text-2xl font-bold">{datasets.reduce((sum, d) => sum + d.samples, 0).toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold">{datasets.filter(d => d.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Training Jobs</p>
                <p className="text-2xl font-bold">{datasets.filter(d => d.status === 'training').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Datasets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Training Datasets
            </div>
            <Button onClick={() => setIsAddingDataset(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dataset
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {datasets.map((dataset) => {
              const TypeIcon = getTypeIcon(dataset.type);
              return (
                <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <TypeIcon className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium">{dataset.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dataset.samples.toLocaleString()} samples • {dataset.size} • Updated {dataset.lastUpdated}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(dataset.status)}>
                      {dataset.status}
                    </Badge>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Dataset Modal */}
      {isAddingDataset && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Add New Training Dataset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dataset Name</Label>
              <Input
                value={newDataset.name}
                onChange={(e) => setNewDataset({...newDataset, name: e.target.value})}
                placeholder="Enter dataset name..."
              />
            </div>

            <div className="space-y-2">
              <Label>Data Type</Label>
              <select 
                className="w-full p-2 border rounded"
                value={newDataset.type}
                onChange={(e) => setNewDataset({...newDataset, type: e.target.value})}
              >
                <option value="text">Text Content</option>
                <option value="image">Image Data</option>
                <option value="mixed">Mixed Content</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newDataset.description}
                onChange={(e) => setNewDataset({...newDataset, description: e.target.value})}
                placeholder="Describe the dataset content and purpose..."
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Files</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to browse
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  // Add dataset logic here
                  setIsAddingDataset(false);
                  setNewDataset({ name: '', type: 'text', description: '' });
                }}
                className="flex-1"
              >
                Create Dataset
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingDataset(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};