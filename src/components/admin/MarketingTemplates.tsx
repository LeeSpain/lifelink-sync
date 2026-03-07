import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  BookOpen,
  Heart,
  Star,
  Calendar,
  Map,
  Sparkles,
  Mail,
  Zap,
  Video
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  prompt: string;
  imagePrompt?: string;
  contentType: string;
  estimatedTime: string;
  tags: string[];
}

interface MarketingTemplatesProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplate?: Template;
  contentType: string; // Add content type filter
}

const MARKETING_TEMPLATES: Template[] = [
  // ===== BLOG POST TEMPLATES =====
  {
    id: 'blog-features-showcase',
    title: 'LifeLink Sync Complete Features Guide',
    description: 'Comprehensive overview of all LifeLink Sync features and benefits',
    category: 'Product Features',
    icon: Shield,
    prompt: 'Create a comprehensive blog post showcasing all LifeLink Sync features. Cover emergency contact management, real-time location sharing, family safety dashboard, SOS button functionality, and cross-platform compatibility. Include screenshots, user scenarios, and step-by-step setup guides.',
    imagePrompt: 'Professional mobile app interface collage showing multiple LifeLink Sync screens including emergency contacts, location sharing, and family dashboard, clean modern design',
    contentType: 'blog',
    estimatedTime: '10-12 min',
    tags: ['Product Features', 'Complete Guide', 'Setup Instructions']
  },
  {
    id: 'blog-emergency-preparedness',
    title: 'Family Emergency Preparedness Blueprint',
    description: 'Complete guide to emergency planning for modern families',
    category: 'Safety Education',
    icon: BookOpen,
    prompt: 'Write an in-depth emergency preparedness guide for families. Cover creating emergency plans, building emergency kits, establishing communication protocols, setting up ICE contacts, and how LifeLink Sync enhances traditional emergency planning. Include downloadable checklists and actionable steps.',
    imagePrompt: 'Family emergency kit laid out neatly with first aid supplies, emergency contacts list, flashlight, water, and smartphone showing LifeLink Sync app',
    contentType: 'blog',
    estimatedTime: '8-10 min',
    tags: ['Emergency Planning', 'Family Safety', 'Preparedness Guide']
  },
  {
    id: 'blog-customer-success',
    title: 'Real Families, Real Stories: LifeLink Sync Success Stories',
    description: 'Inspiring customer testimonials and success stories',
    category: 'Customer Stories',
    icon: Heart,
    prompt: 'Create a compelling blog post featuring real customer success stories about how LifeLink Sync helped families during emergencies. Include 3-4 detailed case studies, quotes from satisfied customers, and the positive outcomes achieved. Focus on emotional connection while highlighting practical benefits.',
    imagePrompt: 'Collage of happy families in different scenarios - traveling, at home, outdoor activities - representing safety and connection',
    contentType: 'blog',
    estimatedTime: '6-8 min',
    tags: ['Customer Stories', 'Testimonials', 'Case Studies']
  },
  {
    id: 'blog-safety-comparison',
    title: 'Family Safety Solutions: Complete Comparison Guide',
    description: 'Objective comparison of family safety apps and traditional methods',
    category: 'Buyer Guide',
    icon: Star,
    prompt: 'Write a comprehensive comparison blog post analyzing LifeLink Sync against other family safety apps and traditional emergency preparedness methods. Include feature comparison tables, pricing analysis, ease of use ratings, and recommendations for different family types.',
    imagePrompt: 'Professional comparison chart infographic showing different safety solutions side by side with checkmarks and ratings',
    contentType: 'blog',
    estimatedTime: '8-10 min',
    tags: ['Comparison', 'Buyer Guide', 'Product Analysis']
  },
  {
    id: 'blog-travel-safety',
    title: 'Ultimate Family Travel Safety Guide',
    description: 'Complete safety checklist and tips for traveling families',
    category: 'Travel Safety',
    icon: Map,
    prompt: 'Create a comprehensive travel safety guide for families. Cover pre-travel preparation, staying connected while traveling, international emergency contacts, travel insurance considerations, and how LifeLink Sync provides peace of mind during family trips. Include destination-specific safety tips.',
    imagePrompt: 'Family at airport with luggage, mobile phones showing location sharing, international travel theme with safety elements',
    contentType: 'blog',
    estimatedTime: '7-9 min',
    tags: ['Travel Safety', 'Family Travel', 'International Safety']
  },

  // ===== SOCIAL MEDIA TEMPLATES =====
  {
    id: 'social-daily-tips',
    title: 'Daily Safety Reminders',
    description: 'Quick, engaging safety tips for daily sharing',
    category: 'Daily Tips',
    icon: Users,
    prompt: 'Create engaging social media posts with daily safety tips for families. Include quick reminders about emergency contacts, location sharing etiquette, child safety practices, and simple safety habits. Make content shareable, visual-friendly, and actionable in under 280 characters.',
    imagePrompt: 'Minimalist infographic with safety icons, clean colorful design, family-friendly aesthetic, perfect for social media',
    contentType: 'social',
    estimatedTime: '3-4 min',
    tags: ['Daily Tips', 'Social Media', 'Quick Content']
  },
  {
    id: 'social-feature-highlights',
    title: 'Feature Spotlight Series',
    description: 'Highlight individual LifeLink Sync features in bite-sized posts',
    category: 'Product Features',
    icon: Sparkles,
    prompt: 'Create a series of social media posts highlighting individual LifeLink Sync features. Each post should focus on one feature (emergency contacts, location sharing, SOS button, etc.) with clear benefits, quick setup tips, and engaging visuals. Keep posts concise and shareable.',
    imagePrompt: 'Clean smartphone mockup showing one specific LifeLink Sync feature with attractive background and clear UI elements',
    contentType: 'social',
    estimatedTime: '2-3 min',
    tags: ['Feature Highlights', 'Product Demo', 'Visual Content']
  },
  {
    id: 'social-testimonials',
    title: 'Customer Quote Cards',
    description: 'Visual testimonials from satisfied customers',
    category: 'Social Proof',
    icon: Heart,
    prompt: 'Design social media posts featuring customer testimonials and quotes. Create visually appealing quote cards with customer feedback, success stories, and positive experiences. Include customer photos (with permission) and star ratings for credibility.',
    imagePrompt: 'Professional quote card design with customer photo, testimonial text, star rating, and LifeLink Sync branding',
    contentType: 'social',
    estimatedTime: '4-5 min',
    tags: ['Testimonials', 'Social Proof', 'Customer Quotes']
  },
  {
    id: 'social-safety-awareness',
    title: 'Safety Awareness Campaigns',
    description: 'Educational content about emergency preparedness',
    category: 'Education',
    icon: Shield,
    prompt: 'Create educational social media content about emergency preparedness and family safety. Include statistics, safety facts, emergency preparedness tips, and awareness campaigns. Make content informative yet engaging for social media consumption.',
    imagePrompt: 'Infographic-style design with safety statistics, emergency icons, and educational content in social media format',
    contentType: 'social',
    estimatedTime: '3-4 min',
    tags: ['Safety Education', 'Awareness', 'Emergency Facts']
  },
  {
    id: 'social-behind-scenes',
    title: 'Behind the Scenes Stories',
    description: 'Company culture and team stories from LifeLink Sync',
    category: 'Brand Story',
    icon: Users,
    prompt: 'Create behind-the-scenes social media content showcasing the LifeLink Sync team, company culture, development process, and mission. Include team member spotlights, development updates, and company values. Make content personal and relatable.',
    imagePrompt: 'Casual team photo or office environment showing LifeLink Sync team members working on safety solutions, warm and professional',
    contentType: 'social',
    estimatedTime: '3-4 min',
    tags: ['Behind the Scenes', 'Team Culture', 'Company Story']
  },

  // ===== EMAIL CAMPAIGN TEMPLATES =====
  {
    id: 'email-welcome-series',
    title: 'New User Welcome Series',
    description: 'Multi-part welcome email sequence for new users',
    category: 'User Onboarding',
    icon: Mail,
    prompt: 'Create a comprehensive welcome email series for new LifeLink Sync users. Include welcome message, setup instructions, feature tutorials, safety tips, and support resources. Design a 5-email sequence that guides users through first-time setup and key features.',
    imagePrompt: 'Professional email template design with welcome message, step-by-step setup guide, and LifeLink Sync branding',
    contentType: 'email',
    estimatedTime: '8-10 min',
    tags: ['Welcome Series', 'User Onboarding', 'Email Sequence']
  },
  {
    id: 'email-monthly-newsletter',
    title: 'Monthly Safety Newsletter',
    description: 'Regular newsletter with safety tips and product updates',
    category: 'Newsletter',
    icon: TrendingUp,
    prompt: 'Create a monthly email newsletter for LifeLink Sync users. Include safety tip of the month, app feature spotlight, customer story highlight, upcoming safety awareness dates, seasonal safety advice, and product updates. Make it valuable and engaging for regular reading.',
    imagePrompt: 'Professional newsletter header design with safety theme, clean layout sections, and family-focused imagery',
    contentType: 'email',
    estimatedTime: '7-9 min',
    tags: ['Newsletter', 'Monthly Updates', 'Safety Tips']
  },
  {
    id: 'email-emergency-guide',
    title: 'Emergency Preparedness Email Course',
    description: 'Educational email series about emergency planning',
    category: 'Education',
    icon: BookOpen,
    prompt: 'Design an educational email course about family emergency preparedness. Create a 7-part series covering emergency planning basics, communication plans, emergency kits, child safety, travel safety, technology tools, and LifeLink Sync integration. Include downloadable resources.',
    imagePrompt: 'Educational email template with course progression, emergency planning graphics, and downloadable resource sections',
    contentType: 'email',
    estimatedTime: '9-11 min',
    tags: ['Email Course', 'Emergency Education', 'Educational Series']
  },
  {
    id: 'email-product-announcements',
    title: 'Product Update Announcements',
    description: 'Feature releases and product improvement communications',
    category: 'Product Updates',
    icon: Zap,
    prompt: 'Create email templates for product announcements and feature releases. Include new feature highlights, improvement summaries, how-to guides for new features, user benefits, and call-to-action to try new features. Make content exciting and informative.',
    imagePrompt: 'Modern email template showcasing new app features with screenshots, before/after comparisons, and update highlights',
    contentType: 'email',
    estimatedTime: '5-7 min',
    tags: ['Product Updates', 'Feature Announcements', 'Release Notes']
  },
  {
    id: 'email-reengagement',
    title: 'User Re-engagement Campaign',
    description: 'Win back inactive users with valuable content',
    category: 'Re-engagement',
    icon: Heart,
    prompt: 'Design a re-engagement email campaign for inactive LifeLink Sync users. Include personalized content, safety reminders, new feature highlights, success stories, exclusive tips, and incentives to return. Focus on the value and peace of mind LifeLink Sync provides.',
    imagePrompt: 'Warm, inviting email design with "we miss you" messaging, family safety benefits, and comeback incentives',
    contentType: 'email',
    estimatedTime: '6-8 min',
    tags: ['Re-engagement', 'Win-back Campaign', 'User Retention']
  },

  // ===== VIDEO SCRIPT TEMPLATES =====
  {
    id: 'video-demo-tutorial',
    title: 'LifeLink Sync App Demo & Tutorial',
    description: 'Complete walkthrough of app features and setup',
    category: 'Product Demo',
    icon: Video,
    prompt: 'Create a comprehensive video script for an LifeLink Sync app demonstration. Include app download and setup, emergency contact configuration, location sharing setup, SOS button demonstration, and family member invitation process. Make it clear, engaging, and easy to follow.',
    imagePrompt: 'Clean video thumbnail showing smartphone with LifeLink Sync app interface, play button overlay, professional tutorial aesthetic',
    contentType: 'video',
    estimatedTime: '10-12 min',
    tags: ['App Demo', 'Tutorial', 'Step-by-step Guide']
  },
  {
    id: 'video-customer-testimonial',
    title: 'Customer Success Story Video',
    description: 'Real customer sharing their LifeLink Sync experience',
    category: 'Testimonial',
    icon: Star,
    prompt: 'Write a video script for customer testimonial featuring a real family sharing their LifeLink Sync experience. Include their safety concerns, how they discovered LifeLink Sync, setup experience, actual usage during an emergency, and how it provided peace of mind. Keep authentic and emotional.',
    imagePrompt: 'Authentic family portrait or interview setup with family members, warm lighting, genuine expressions',
    contentType: 'video',
    estimatedTime: '6-8 min',
    tags: ['Customer Story', 'Testimonial Video', 'Real Experience']
  },
  {
    id: 'video-safety-education',
    title: 'Family Safety Education Series',
    description: 'Educational content about emergency preparedness',
    category: 'Safety Education',
    icon: Shield,
    prompt: 'Create an educational video script about family emergency preparedness. Cover emergency plan creation, communication strategies, emergency kit essentials, child safety education, and how technology like LifeLink Sync enhances traditional safety planning. Make it informative yet engaging.',
    imagePrompt: 'Educational video setup with safety demonstration, family emergency kit display, and clear instructional elements',
    contentType: 'video',
    estimatedTime: '8-10 min',
    tags: ['Safety Education', 'Emergency Planning', 'Family Safety']
  },
  {
    id: 'video-comparison-guide',
    title: 'LifeLink Sync vs Other Safety Apps',
    description: 'Comparison video highlighting LifeLink Sync advantages',
    category: 'Product Comparison',
    icon: Star,
    prompt: 'Write a video script comparing LifeLink Sync with other family safety apps. Include side-by-side feature comparisons, ease of use demonstrations, pricing analysis, and unique LifeLink Sync advantages. Keep objective while highlighting our strengths.',
    imagePrompt: 'Split-screen comparison showing different safety apps, feature comparison charts, professional analysis setup',
    contentType: 'video',
    estimatedTime: '7-9 min',
    tags: ['Product Comparison', 'Competitive Analysis', 'App Review']
  },
  {
    id: 'video-quick-tips',
    title: 'Quick Safety Tips Series',
    description: 'Short-form safety tips for social media',
    category: 'Safety Tips',
    icon: Zap,
    prompt: 'Create scripts for short-form safety tip videos perfect for social media. Each video should cover one specific safety tip in 60 seconds or less. Include emergency contact management, location sharing best practices, child safety tips, travel safety, and LifeLink Sync quick tips.',
    imagePrompt: 'Dynamic, colorful video thumbnail with safety tip text overlay, engaging visual elements, social media optimized',
    contentType: 'video',
    estimatedTime: '3-4 min',
    tags: ['Quick Tips', 'Short-form Video', 'Social Media Content']
  }
];

const getCategoryColor = (category: string): string => {
  const colors = {
    'Product Promotion': 'bg-blue-100 text-blue-700 border-blue-200',
    'Safety Education': 'bg-green-100 text-green-700 border-green-200',
    'Customer Stories': 'bg-purple-100 text-purple-700 border-purple-200',
    'Seasonal Content': 'bg-orange-100 text-orange-700 border-orange-200',
    'Social Engagement': 'bg-pink-100 text-pink-700 border-pink-200',
    'Email Marketing': 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };
  return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const MarketingTemplates: React.FC<MarketingTemplatesProps> = ({
  onSelectTemplate,
  selectedTemplate,
  contentType
}) => {
  // Filter templates by content type
  const filteredTemplates = MARKETING_TEMPLATES.filter(
    template => template.contentType === contentType
  );

  const getContentTypeTitle = (type: string): string => {
    const titles = {
      'blog': 'Blog Post Templates',
      'social': 'Social Media Templates', 
      'email': 'Email Campaign Templates',
      'video': 'Video Script Templates'
    };
    return titles[type] || 'Marketing Templates';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{getContentTypeTitle(contentType)}</h3>
        <p className="text-muted-foreground text-sm">
          Choose from {filteredTemplates.length} professionally crafted templates for {contentType === 'blog' ? 'blog posts' : contentType === 'social' ? 'social media' : contentType === 'email' ? 'email campaigns' : 'video scripts'}
        </p>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No templates available for {contentType} content type.</p>
          <p className="text-sm mt-1">Templates will be added soon!</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1 line-clamp-1">
                      {template.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryColor(template.category)}`}
                    >
                      {template.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    ~{template.estimatedTime}
                  </span>
                  <div className="flex gap-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTemplate && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <selectedTemplate.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-2">{selectedTemplate.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedTemplate.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};