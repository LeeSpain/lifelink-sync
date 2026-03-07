// Content Quality Analysis and Validation
import { errorReporter } from './errorReporting';

export interface QualityMetrics {
  score: number;
  readabilityScore: number;
  seoScore: number;
  engagementPotential: number;
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'seo' | 'readability' | 'engagement' | 'technical';
  message: string;
  severity: number; // 1-10
}

class ContentQualityAnalyzer {
  analyzeContent(content: string, title: string, description?: string): QualityMetrics {
    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];

    // SEO Analysis
    const seoScore = this.analyzeSEO(content, title, description, issues, recommendations);
    
    // Readability Analysis
    const readabilityScore = this.analyzeReadability(content, issues, recommendations);
    
    // Engagement Analysis
    const engagementPotential = this.analyzeEngagement(content, title, issues, recommendations);

    const overallScore = Math.round((seoScore + readabilityScore + engagementPotential) / 3);

    return {
      score: overallScore,
      readabilityScore,
      seoScore,
      engagementPotential,
      issues,
      recommendations
    };
  }

  private analyzeSEO(content: string, title: string, description: string | undefined, issues: QualityIssue[], recommendations: string[]): number {
    let score = 100;

    // Title length check
    if (title.length < 30 || title.length > 60) {
      issues.push({
        type: 'warning',
        category: 'seo',
        message: 'Title should be 30-60 characters for optimal SEO',
        severity: 6
      });
      score -= 15;
      recommendations.push('Optimize title length for search engines');
    }

    // Meta description check
    if (description) {
      if (description.length < 120 || description.length > 160) {
        issues.push({
          type: 'warning',
          category: 'seo',
          message: 'Meta description should be 120-160 characters',
          severity: 5
        });
        score -= 10;
      }
    } else {
      issues.push({
        type: 'error',
        category: 'seo',
        message: 'Missing meta description',
        severity: 8
      });
      score -= 20;
      recommendations.push('Add a compelling meta description');
    }

    // Keyword density (basic check)
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    const maxFreq = Math.max(...wordFreq.values());
    const keywordDensity = (maxFreq / wordCount) * 100;

    if (keywordDensity > 5) {
      issues.push({
        type: 'warning',
        category: 'seo',
        message: 'Potential keyword stuffing detected',
        severity: 7
      });
      score -= 15;
      recommendations.push('Reduce keyword density for natural reading');
    }

    // Content length check
    if (wordCount < 300) {
      issues.push({
        type: 'warning',
        category: 'seo',
        message: 'Content is too short for good SEO performance',
        severity: 6
      });
      score -= 10;
      recommendations.push('Expand content to at least 300 words');
    }

    return Math.max(0, score);
  }

  private analyzeReadability(content: string, issues: QualityIssue[], recommendations: string[]): number {
    let score = 100;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/);
    const totalWords = words.length;
    const totalSentences = sentences.length;

    if (totalSentences === 0) return 0;

    // Average sentence length
    const avgSentenceLength = totalWords / totalSentences;
    if (avgSentenceLength > 20) {
      issues.push({
        type: 'warning',
        category: 'readability',
        message: 'Sentences are too long on average',
        severity: 5
      });
      score -= 15;
      recommendations.push('Break down long sentences for better readability');
    }

    // Paragraph length (approximate)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    const avgParagraphLength = totalWords / Math.max(paragraphs.length, 1);
    
    if (avgParagraphLength > 150) {
      issues.push({
        type: 'warning',
        category: 'readability',
        message: 'Paragraphs are too long',
        severity: 4
      });
      score -= 10;
      recommendations.push('Break content into shorter paragraphs');
    }

    // Complex words (>3 syllables - rough estimation)
    const complexWords = words.filter(word => this.estimateSyllables(word) > 3);
    const complexWordRatio = complexWords.length / totalWords;

    if (complexWordRatio > 0.15) {
      issues.push({
        type: 'info',
        category: 'readability',
        message: 'High use of complex words',
        severity: 3
      });
      score -= 5;
      recommendations.push('Consider simpler alternatives for complex words');
    }

    return Math.max(0, score);
  }

  private analyzeEngagement(content: string, title: string, issues: QualityIssue[], recommendations: string[]): number {
    let score = 100;

    // Emotional words check
    const emotionalWords = [
      'amazing', 'incredible', 'awesome', 'fantastic', 'excellent', 'outstanding',
      'terrible', 'awful', 'horrible', 'devastating', 'shocking', 'surprising',
      'love', 'hate', 'passion', 'excited', 'thrilled', 'disappointed'
    ];

    const contentLower = content.toLowerCase();
    const emotionalWordCount = emotionalWords.filter(word => 
      contentLower.includes(word)
    ).length;

    if (emotionalWordCount === 0) {
      issues.push({
        type: 'info',
        category: 'engagement',
        message: 'Content lacks emotional words',
        severity: 3
      });
      score -= 10;
      recommendations.push('Add emotional words to increase engagement');
    }

    // Question marks (engagement technique)
    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount === 0) {
      issues.push({
        type: 'info',
        category: 'engagement',
        message: 'No questions found in content',
        severity: 2
      });
      score -= 5;
      recommendations.push('Add questions to engage readers');
    }

    // Call-to-action detection
    const ctaWords = ['subscribe', 'follow', 'share', 'comment', 'like', 'join', 'download', 'learn more'];
    const hasCTA = ctaWords.some(word => contentLower.includes(word));
    
    if (!hasCTA) {
      issues.push({
        type: 'warning',
        category: 'engagement',
        message: 'No clear call-to-action found',
        severity: 6
      });
      score -= 15;
      recommendations.push('Add a clear call-to-action');
    }

    // Title engagement check
    const titleLower = title.toLowerCase();
    const engagingTitleWords = ['how to', 'why', 'what', 'when', 'where', 'ultimate', 'complete', 'guide'];
    const hasEngagingTitle = engagingTitleWords.some(phrase => titleLower.includes(phrase));

    if (!hasEngagingTitle) {
      issues.push({
        type: 'info',
        category: 'engagement',
        message: 'Title could be more engaging',
        severity: 4
      });
      score -= 10;
      recommendations.push('Consider using engaging title patterns');
    }

    return Math.max(0, score);
  }

  private estimateSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = word.match(/[aeiouy]+/g);
    let syllables = vowels ? vowels.length : 1;
    
    if (word.endsWith('e')) syllables--;
    if (word.endsWith('le') && word.length > 2) syllables++;
    
    return Math.max(1, syllables);
  }

  validateForPublishing(content: string, title: string, platform: string): { canPublish: boolean; criticalIssues: QualityIssue[] } {
    const analysis = this.analyzeContent(content, title);
    const criticalIssues = analysis.issues.filter(issue => 
      issue.type === 'error' || issue.severity >= 7
    );

    // Platform-specific validation
    const platformIssues = this.validatePlatformRequirements(content, title, platform);
    criticalIssues.push(...platformIssues);

    const canPublish = criticalIssues.length === 0 && analysis.score >= 60;

    if (!canPublish) {
      errorReporter.reportError(new Error('Content failed quality validation'), {
        platform,
        score: analysis.score,
        criticalIssues: criticalIssues.length,
        title: title.substring(0, 50)
      });
    }

    return { canPublish, criticalIssues };
  }

  private validatePlatformRequirements(content: string, title: string, platform: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    switch (platform) {
      case 'twitter':
        if (content.length > 280) {
          issues.push({
            type: 'error',
            category: 'technical',
            message: 'Content exceeds Twitter character limit',
            severity: 10
          });
        }
        break;
      
      case 'linkedin':
        if (content.length > 3000) {
          issues.push({
            type: 'error',
            category: 'technical',
            message: 'Content exceeds LinkedIn character limit',
            severity: 10
          });
        }
        break;
      
      case 'facebook':
        if (content.length > 63206) {
          issues.push({
            type: 'error',
            category: 'technical',
            message: 'Content exceeds Facebook character limit',
            severity: 10
          });
        }
        break;
    }

    return issues;
  }
}

export const contentQualityAnalyzer = new ContentQualityAnalyzer();

// Batch quality analysis for multiple content pieces
export async function batchQualityAnalysis(
  contentItems: Array<{ content: string; title: string; description?: string; platform?: string }>
): Promise<Array<{ item: any; metrics: QualityMetrics; canPublish: boolean }>> {
  return contentItems.map(item => {
    const metrics = contentQualityAnalyzer.analyzeContent(item.content, item.title, item.description);
    const { canPublish } = item.platform 
      ? contentQualityAnalyzer.validateForPublishing(item.content, item.title, item.platform)
      : { canPublish: metrics.score >= 60 };

    return { item, metrics, canPublish };
  });
}