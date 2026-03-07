import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Code, Save, Send, User, Mail, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplateEditorProps {
  content: any;
  onSave?: (template: any) => void;
  onPreview?: (template: any) => void;
  onSend?: (template: any) => void;
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  content,
  onSave,
  onPreview,
  onSend
}) => {
  const [template, setTemplate] = useState({
    subject: content?.title || '',
    preheader: content?.meta_description || '',
    headerText: 'Newsletter Update',
    bodyType: 'rich',
    bodyContent: content?.body_text || '',
    footerText: 'Thank you for subscribing!',
    usePersonalization: true,
    includeUnsubscribe: true,
    includeImages: content?.image_url ? true : false,
    buttonText: 'Read More',
    buttonUrl: '#',
    styles: {
      primaryColor: '#007bff',
      textColor: '#333333',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }
  });

  const { toast } = useToast();

  const handleTemplateChange = (field: string, value: any) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStyleChange = (styleField: string, value: string) => {
    setTemplate(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [styleField]: value
      }
    }));
  };

  const generatePreview = () => {
    const preview = {
      ...template,
      generatedHTML: generateEmailHTML(),
      generatedText: generateEmailText()
    };
    
    onPreview?.(preview);
    
    toast({
      title: "Preview Generated",
      description: "Email preview has been updated."
    });
  };

  const generateEmailHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject}</title>
    <style>
        body { 
            font-family: ${template.styles.fontFamily}; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5;
            color: ${template.styles.textColor};
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: ${template.styles.backgroundColor}; 
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            background: ${template.styles.primaryColor}; 
            color: white;
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: bold;
        }
        .preheader {
            display: none;
            max-height: 0;
            overflow: hidden;
        }
        .content { 
            padding: 30px 20px; 
        }
        .content h2 {
            color: ${template.styles.primaryColor};
            margin-top: 0;
        }
        .content p {
            margin-bottom: 15px;
        }
        .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            background: ${template.styles.primaryColor}; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
            margin: 20px 0;
        }
        .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #666;
        }
        .footer a {
            color: ${template.styles.primaryColor};
            text-decoration: none;
        }
        img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 4px;
        }
        .personalization {
            background: #f8f9fa;
            padding: 10px;
            border-left: 4px solid ${template.styles.primaryColor};
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="preheader">${template.preheader}</div>
    <div class="container">
        <div class="header">
            <h1>${template.headerText}</h1>
        </div>
        <div class="content">
            ${template.usePersonalization ? '<div class="personalization">Hello {{first_name}},</div>' : ''}
            ${content?.image_url && template.includeImages ? `<img src="${content.image_url}" alt="${content.featured_image_alt || 'Featured image'}" style="margin-bottom: 20px;">` : ''}
            <h2>${content?.title || 'Content Title'}</h2>
            ${template.bodyContent ? template.bodyContent.split('\\n').map(p => `<p>${p}</p>`).join('') : '<p>Your content will appear here...</p>'}
            ${template.buttonText && template.buttonUrl ? `<div style="text-align: center;"><a href="${template.buttonUrl}" class="btn">${template.buttonText}</a></div>` : ''}
            ${content?.hashtags && content.hashtags.length > 0 ? `<p style="margin-top: 20px;"><strong>Tags:</strong> ${content.hashtags.join(', ')}</p>` : ''}
        </div>
        <div class="footer">
            <p>${template.footerText}</p>
            ${template.includeUnsubscribe ? '<p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>' : ''}
        </div>
    </div>
</body>
</html>`;
  };

  const generateEmailText = () => {
    return `
${template.headerText}

${template.usePersonalization ? 'Hello {{first_name}},' : ''}

${content?.title || 'Content Title'}

${template.bodyContent || 'Your content will appear here...'}

${template.buttonText && template.buttonUrl ? `${template.buttonText}: ${template.buttonUrl}` : ''}

${content?.hashtags && content.hashtags.length > 0 ? `Tags: ${content.hashtags.join(', ')}` : ''}

---
${template.footerText}
${template.includeUnsubscribe ? 'Unsubscribe: {{unsubscribe_url}}' : ''}
${template.includeUnsubscribe ? 'Update Preferences: {{preferences_url}}' : ''}
`;
  };

  const handleSave = () => {
    const finalTemplate = {
      ...template,
      generatedHTML: generateEmailHTML(),
      generatedText: generateEmailText()
    };
    
    onSave?.(finalTemplate);
    
    toast({
      title: "Template Saved",
      description: "Email template has been saved successfully."
    });
  };

  const handleSend = () => {
    const finalTemplate = {
      ...template,
      generatedHTML: generateEmailHTML(),
      generatedText: generateEmailText()
    };
    
    onSend?.(finalTemplate);
    
    toast({
      title: "Email Sent",
      description: "Email campaign has been queued for sending."
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Template Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="personalization">Personalization</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={template.subject}
                  onChange={(e) => handleTemplateChange('subject', e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>
              
              <div>
                <Label htmlFor="preheader">Preheader Text</Label>
                <Input
                  id="preheader"
                  value={template.preheader}
                  onChange={(e) => handleTemplateChange('preheader', e.target.value)}
                  placeholder="Preview text that appears in inbox..."
                />
              </div>
              
              <div>
                <Label htmlFor="header">Header Text</Label>
                <Input
                  id="header"
                  value={template.headerText}
                  onChange={(e) => handleTemplateChange('headerText', e.target.value)}
                  placeholder="Email header title..."
                />
              </div>
              
              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  value={template.bodyContent}
                  onChange={(e) => handleTemplateChange('bodyContent', e.target.value)}
                  placeholder="Email body content..."
                  rows={8}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button-text">Button Text</Label>
                  <Input
                    id="button-text"
                    value={template.buttonText}
                    onChange={(e) => handleTemplateChange('buttonText', e.target.value)}
                    placeholder="Call to action text..."
                  />
                </div>
                <div>
                  <Label htmlFor="button-url">Button URL</Label>
                  <Input
                    id="button-url"
                    value={template.buttonUrl}
                    onChange={(e) => handleTemplateChange('buttonUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="footer">Footer Text</Label>
                <Input
                  id="footer"
                  value={template.footerText}
                  onChange={(e) => handleTemplateChange('footerText', e.target.value)}
                  placeholder="Footer message..."
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="design" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <Input
                  id="primary-color"
                  type="color"
                  value={template.styles.primaryColor}
                  onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="text-color">Text Color</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={template.styles.textColor}
                  onChange={(e) => handleStyleChange('textColor', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bg-color">Background Color</Label>
                <Input
                  id="bg-color"
                  type="color"
                  value={template.styles.backgroundColor}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Select 
                  value={template.styles.fontFamily} 
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="personalization" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="personalization"
                    checked={template.usePersonalization}
                    onCheckedChange={(checked) => handleTemplateChange('usePersonalization', checked)}
                  />
                  <Label htmlFor="personalization">Use Personalization</Label>
                </div>
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  {"{{first_name}}, {{last_name}}, {{email}}"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="images"
                    checked={template.includeImages}
                    onCheckedChange={(checked) => handleTemplateChange('includeImages', checked)}
                  />
                  <Label htmlFor="images">Include Images</Label>
                </div>
                <Badge variant="outline">
                  <Image className="h-3 w-3 mr-1" />
                  Auto-include featured images
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="unsubscribe"
                    checked={template.includeUnsubscribe}
                    onCheckedChange={(checked) => handleTemplateChange('includeUnsubscribe', checked)}
                  />
                  <Label htmlFor="unsubscribe">Include Unsubscribe Links</Label>
                </div>
                <Badge variant="outline">Required by law</Badge>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={generatePreview} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Update Preview
                </Button>
                <Button onClick={() => {/* Show HTML preview */}} variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  View HTML
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted">
                <h4 className="font-semibold mb-2">Email Preview</h4>
                <div className="text-sm text-muted-foreground">
                  <strong>Subject:</strong> {template.subject}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  <strong>Preheader:</strong> {template.preheader}
                </div>
                <div 
                  className="border rounded bg-white p-4 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
          <Button onClick={handleSend}>
            <Send className="h-4 w-4 mr-2" />
            Send Campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};