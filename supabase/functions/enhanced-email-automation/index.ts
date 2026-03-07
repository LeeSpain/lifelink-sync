import React from 'npm:react@18.3.1';
import { render } from 'npm:@react-email/components@0.0.22';
import { Resend } from 'npm:resend@4.0.0';

// Email Templates
const WelcomeEmail = ({ name, companyName }: { name: string; companyName: string }) => {
  return React.createElement('div', { style: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' } },
    React.createElement('div', { style: { backgroundColor: '#1e40af', color: 'white', padding: '20px', textAlign: 'center' } },
      React.createElement('h1', { style: { margin: '0', fontSize: '24px' } }, `Welcome to ${companyName}, ${name}!`)
    ),
    React.createElement('div', { style: { padding: '30px' } },
      React.createElement('h2', { style: { color: '#333', fontSize: '20px' } }, 'Your family\'s safety is our priority'),
      React.createElement('p', { style: { color: '#666', lineHeight: '1.6' } }, 
        'Thank you for choosing LifeLink Sync to keep your family safe. Our emergency response system is now active and ready to protect your loved ones 24/7.'
      ),
      React.createElement('div', { style: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', margin: '20px 0' } },
        React.createElement('h3', { style: { margin: '0 0 10px 0', color: '#1e40af' } }, 'Next Steps:'),
        React.createElement('ul', { style: { margin: '0', paddingLeft: '20px', color: '#666' } },
          React.createElement('li', null, 'Complete your family emergency contacts'),
          React.createElement('li', null, 'Download the mobile app'),
          React.createElement('li', null, 'Test your emergency button'),
          React.createElement('li', null, 'Share with family members')
        )
      ),
      React.createElement('div', { style: { textAlign: 'center', marginTop: '30px' } },
        React.createElement('a', { 
          href: 'https://lifelink-sync.com/dashboard',
          style: {
            backgroundColor: '#1e40af',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-block'
          }
        }, 'Access Your Dashboard')
      )
    ),
    React.createElement('div', { style: { backgroundColor: '#f1f5f9', padding: '20px', textAlign: 'center', fontSize: '14px', color: '#666' } },
      'Need help? Contact our support team at support@lifelink-sync.com',
      React.createElement('br'),
      '© 2024 LifeLink Sync. Keeping families safe worldwide.'
    )
  );
};

const CampaignEmail = ({ 
  title, 
  content, 
  ctaText, 
  ctaUrl, 
  imageUrl 
}: { 
  title: string; 
  content: string; 
  ctaText: string; 
  ctaUrl: string; 
  imageUrl?: string; 
}) => {
  return React.createElement('div', { style: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' } },
    imageUrl && React.createElement('img', { 
      src: imageUrl, 
      alt: title,
      style: { width: '100%', height: '200px', objectFit: 'cover' }
    }),
    React.createElement('div', { style: { padding: '30px' } },
      React.createElement('h1', { style: { color: '#1e40af', fontSize: '24px', marginBottom: '20px' } }, title),
      React.createElement('div', { 
        style: { color: '#666', lineHeight: '1.6', marginBottom: '30px' },
        dangerouslySetInnerHTML: { __html: content }
      }),
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement('a', { 
          href: ctaUrl,
          style: {
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '14px 28px',
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-block',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        }, ctaText)
      )
    ),
    React.createElement('div', { style: { backgroundColor: '#f8fafc', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#999' } },
      'You received this email because you subscribed to LifeLink Sync updates.',
      React.createElement('br'),
      React.createElement('a', { href: '#', style: { color: '#666' } }, 'Unsubscribe') + ' | ' +
      React.createElement('a', { href: '#', style: { color: '#666' } }, 'Update Preferences')
    )
  );
};

const NewsletterEmail = ({ 
  articles, 
  tips, 
  month 
}: { 
  articles: Array<{title: string, excerpt: string, url: string}>; 
  tips: string[]; 
  month: string; 
}) => {
  return React.createElement('div', { style: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' } },
    React.createElement('div', { style: { backgroundColor: '#1e40af', color: 'white', padding: '20px', textAlign: 'center' } },
      React.createElement('h1', { style: { margin: '0', fontSize: '24px' } }, `Family Safety Newsletter - ${month}`)
    ),
    React.createElement('div', { style: { padding: '30px' } },
      React.createElement('h2', { style: { color: '#1e40af', fontSize: '20px', marginBottom: '20px' } }, 'This Month\'s Safety Articles'),
      ...articles.map((article, index) => 
        React.createElement('div', { key: index, style: { marginBottom: '25px', paddingBottom: '20px', borderBottom: index < articles.length - 1 ? '1px solid #e5e7eb' : 'none' } },
          React.createElement('h3', { style: { color: '#333', fontSize: '18px', marginBottom: '8px' } }, article.title),
          React.createElement('p', { style: { color: '#666', lineHeight: '1.6', marginBottom: '10px' } }, article.excerpt),
          React.createElement('a', { 
            href: article.url,
            style: { color: '#1e40af', textDecoration: 'none', fontWeight: 'bold' }
          }, 'Read More →')
        )
      ),
      React.createElement('div', { style: { backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', marginTop: '30px' } },
        React.createElement('h3', { style: { color: '#92400e', marginBottom: '15px' } }, '💡 Quick Safety Tips'),
        React.createElement('ul', { style: { margin: '0', paddingLeft: '20px', color: '#92400e' } },
          ...tips.map((tip, index) => React.createElement('li', { key: index, style: { marginBottom: '5px' } }, tip))
        )
      )
    )
  );
};

const serve = async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const resend = new Resend(resendApiKey);
    const { emailType, recipients, data } = await req.json();

    console.log(`Sending ${emailType} email to ${recipients.length} recipients`);

    let htmlContent = '';
    let subject = '';

    switch (emailType) {
      case 'welcome':
        htmlContent = await render(WelcomeEmail({ 
          name: data.name, 
          companyName: 'LifeLink Sync' 
        }));
        subject = `Welcome to LifeLink Sync, ${data.name}! 🛡️`;
        break;

      case 'campaign':
        htmlContent = await render(CampaignEmail({
          title: data.title,
          content: data.content,
          ctaText: data.ctaText || 'Learn More',
          ctaUrl: data.ctaUrl || 'https://lifelink-sync.com',
          imageUrl: data.imageUrl
        }));
        subject = data.subject || data.title;
        break;

      case 'newsletter':
        htmlContent = await render(NewsletterEmail({
          articles: data.articles || [],
          tips: data.tips || [],
          month: data.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        }));
        subject = `Family Safety Newsletter - ${data.month || 'This Month'}`;
        break;

      default:
        throw new Error('Invalid email type');
    }

    // Send to all recipients
    const emailPromises = recipients.map(async (recipient: any) => {
      try {
        const result = await resend.emails.send({
          from: data.from || 'LifeLink Sync <noreply@lifelink-sync.com>',
          to: [recipient.email],
          subject: subject,
          html: htmlContent,
          ...(data.replyTo && { reply_to: data.replyTo })
        });

        // Log to database
        await logEmailSent({
          recipient: recipient.email,
          emailType,
          subject,
          status: 'sent',
          resendId: result.data?.id
        });

        return { email: recipient.email, status: 'sent', id: result.data?.id };
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        
        await logEmailSent({
          recipient: recipient.email,
          emailType,
          subject,
          status: 'failed',
          error: error.message
        });

        return { email: recipient.email, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return new Response(JSON.stringify({
      success: true,
      sent,
      failed,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in email automation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

async function logEmailSent(data: {
  recipient: string;
  emailType: string;
  subject: string;
  status: string;
  resendId?: string;
  error?: string;
}) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) return;

    await fetch(`${supabaseUrl}/rest/v1/email_queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        recipient_email: data.recipient,
        subject: data.subject,
        status: data.status,
        error_message: data.error,
        sent_at: data.status === 'sent' ? new Date().toISOString() : null
      }),
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

export default serve;