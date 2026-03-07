import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Settings, 
  Zap, 
  Target, 
  Sliders,
  Save,
  RotateCcw
} from 'lucide-react';

export const AISettings: React.FC = () => {
  const [creativity, setCreativity] = useState([75]);
  const [contentLength, setContentLength] = useState([60]);
  const [seoFocus, setSeoFocus] = useState([80]);
  const [brandVoice, setBrandVoice] = useState('professional');
  const [autoApproval, setAutoApproval] = useState(false);
  const [qualityThreshold, setQualityThreshold] = useState([85]);

  const [customPrompts, setCustomPrompts] = useState({
    system: "You are a family safety marketing expert specializing in emergency preparedness content for LifeLink Sync.",
    safety: "Always prioritize factual safety information and avoid fear-mongering tactics.",
    brand: "Maintain a caring, trustworthy tone that reassures families while educating them."
  });

  return (
    <div className="space-y-6">
      {/* AI Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Model Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Primary Model</Label>
              <Select defaultValue="gpt-4-turbo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fallback Model</Label>
              <Select defaultValue="gpt-3.5-turbo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-instant">Claude Instant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Creativity Level: {creativity[0]}%</Label>
              <Slider
                value={creativity}
                onValueChange={setCreativity}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher values generate more creative and varied content
              </p>
            </div>

            <div className="space-y-2">
              <Label>Content Length Preference: {contentLength[0]}%</Label>
              <Slider
                value={contentLength}
                onValueChange={setContentLength}
                max={100}
                min={20}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Longer content for detailed explanations, shorter for social media
              </p>
            </div>

            <div className="space-y-2">
              <Label>SEO Focus: {seoFocus[0]}%</Label>
              <Slider
                value={seoFocus}
                onValueChange={setSeoFocus}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher values prioritize search engine optimization
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Content Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Brand Voice</Label>
              <Select value={brandVoice} onValueChange={setBrandVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                  <SelectItem value="empathetic">Empathetic</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Category Focus</Label>
              <Select defaultValue="safety">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Family Safety</SelectItem>
                  <SelectItem value="emergency">Emergency Preparedness</SelectItem>
                  <SelectItem value="technology">Safety Technology</SelectItem>
                  <SelectItem value="education">Safety Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Approval for High Quality Content</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically approve content that meets quality threshold
                </p>
              </div>
              <Switch checked={autoApproval} onCheckedChange={setAutoApproval} />
            </div>

            {autoApproval && (
              <div className="space-y-2">
                <Label>Quality Threshold: {qualityThreshold[0]}%</Label>
                <Slider
                  value={qualityThreshold}
                  onValueChange={setQualityThreshold}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            Custom System Prompts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>System Prompt</Label>
            <Textarea
              value={customPrompts.system}
              onChange={(e) => setCustomPrompts({...customPrompts, system: e.target.value})}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Safety Guidelines</Label>
            <Textarea
              value={customPrompts.safety}
              onChange={(e) => setCustomPrompts({...customPrompts, safety: e.target.value})}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Brand Guidelines</Label>
            <Textarea
              value={customPrompts.brand}
              onChange={(e) => setCustomPrompts({...customPrompts, brand: e.target.value})}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
        <Button variant="outline" className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};